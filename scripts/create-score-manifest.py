"""Generate a deployment-bound scoring manifest from real paper.json projects."""
import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess


def digest(value):
    if not isinstance(value, bytes):
        value = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(value).hexdigest()


def safe_id(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_.-]{0,240}', value) or '..' in value:
        raise ValueError('Invalid project identifier')
    return value


def make_manifest(source, site, repository, source_sha, base_url, policy, *, arxiv_only=False):
    source, site = Path(source).resolve(), Path(site).resolve()
    if not re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', source_sha):
        raise ValueError('A complete source SHA is required')
    def git(*args, **kwargs):
        return subprocess.check_output(['git', '-C', str(source), *args], **kwargs)
    if git('rev-parse', 'HEAD', text=True).strip() != source_sha:
        raise ValueError('Source checkout differs from deployment SHA')
    tracked = []
    for entry in git('ls-tree', '-r', '-z', 'HEAD').split(b'\0'):
        if entry:
            header, raw_path = entry.split(b'\t', 1)
            mode, kind, blob = header.decode().split()
            tracked.append((raw_path.decode('utf-8'), mode, kind, blob))
    metadata = []
    common = {}
    for path, mode, kind, blob in tracked:
        parts = PurePosixPath(path).parts
        if parts[0] == 'html_output':
            if mode not in {'100644', '100755'} or kind != 'blob':
                raise ValueError('Linked or non-file html_output entry: ' + path)
            if len(parts) == 4 and parts[-1] == 'paper.json':
                metadata.append((safe_id(parts[1]), safe_id(parts[2]), blob))
        elif path.startswith('scripts/') or path in {'package.json', 'package-lock.json'}:
            common[path] = blob
    if not metadata:
        raise ValueError('No tracked paper.json projects')
    raw = git('cat-file', '--batch', input=''.join(blob + '\n' for _, _, blob in metadata).encode('ascii'))
    stream = io.BytesIO(raw)
    metas = {}
    for paper, version, blob in metadata:
        header = stream.readline().decode('ascii').split()
        if len(header) != 3 or header[:2] != [blob, 'blob']:
            raise ValueError('Unexpected metadata blob response')
        data = stream.read(int(header[2]))
        if stream.read(1) != b'\n':
            raise ValueError('Truncated metadata blob')
        meta = json.loads(data.decode('utf-8-sig'))
        if meta.get('paperName') != paper or meta.get('version') != version:
            raise ValueError('Metadata identity differs from project path')
        metas[paper, version] = meta
    projects = {key: {} for key in metas}
    # Older exports can leave a Vite build next to the version directories.
    # Those assets are outside the projects enumerated in the catalog.
    versioned_papers = {paper for paper, _ in metas}
    tracked_paths = {path for path, _, _, _ in tracked}
    legacy_exports = set()
    for path in tracked_paths:
        match = re.fullmatch(r'html_output/([^/]+)/assets/index-[^/]+\.js', path)
        if match:
            paper = match[1]
            if paper in versioned_papers and f'html_output/{paper}/index.html' in tracked_paths:
                legacy_exports.add(paper)
    for path, _, _, blob in tracked:
        parts = PurePosixPath(path).parts
        if parts[0] == 'html_output' and len(parts) >= 4:
            key = parts[1], parts[2]
            if key not in projects:
                if parts[1] in legacy_exports and parts[2] in {'assets', 'images'}:
                    continue
                raise ValueError('Tracked version lacks paper.json: ' + path)
            projects[key]['/'.join(parts[3:])] = blob
    catalog = json.loads((site / 'papers.json').read_text(encoding='utf-8-sig'))
    papers = catalog.get('papers') if isinstance(catalog, dict) else catalog
    entries = set()
    for paper in papers:
        for version in paper.get('versions') or [paper]:
            key = paper['paperName'], version['version']
            if key in entries:
                raise ValueError('Duplicate catalog version')
            entries.add(key)
    if entries != set(projects):
        raise ValueError('Built catalog and tracked projects differ')
    rows = {row['key']: row for row in policy['results']}
    if set(rows) != {'/'.join(key) for key in projects}:
        raise ValueError('Database policy and tracked projects differ')
    versions, skipped = [], []
    for key, files in sorted(projects.items()):
        meta, row = metas[key], rows['/'.join(key)]
        if row['status'] == 'blocked':
            raise ValueError('Invalid database metadata: ' + row['key'] + ': ' + row.get('reason', 'unknown'))
        if arxiv_only and row['status'] != 'ready':
            skipped.append({'key': '/'.join(key), 'reason': row.get('reason', 'Not eligible for database sync')})
            continue
        directory = site / 'papers' / key[0] / key[1]
        built = {}
        for file in sorted(directory.rglob('*')):
            if file.is_symlink() or not file.resolve().is_relative_to(site):
                raise ValueError('Linked deployed file')
            if file.is_file():
                built[file.relative_to(directory).as_posix()] = digest(file.read_bytes())
        if 'index.html' not in built:
            raise ValueError('Tutorial is not built: ' + '/'.join(key))
        authors = meta.get('participants') or []
        author = authors[0] if len(authors) == 1 else {}
        tutorial = {'paper_id': key[0], 'version_id': key[1], 'title': meta['title'],
            'paper_url': 'https://arxiv.org/abs/' + row['identifier'] if row['status'] == 'ready' else meta['paperUrl'],
            'tutorial_url': base_url.rstrip('/') + f'/papers/{key[0]}/{key[1]}/',
            'status': meta.get('status', 'unknown'), 'version_name': key[1], 'version_date': meta.get('versionDate') or '',
            'user_display_name': author.get('name', ''), 'user_github_name': author.get('github', ''),
            'page_path': f'papers/{key[0]}/{key[1]}/',
            'arxiv_id': row.get('identifier', '') if row['status'] == 'ready' else ''}
        source_fingerprint = digest({'files': files, 'build': common})
        versions.append({'tutorial': tutorial, 'files': built, 'source_fingerprint': source_fingerprint,
            'content_fingerprint': digest({'source': source_fingerprint, 'files': built})})
    return {'schema_version': 1, 'source_repository': repository, 'source_sha': source_sha,
        'site_base': base_url.rstrip('/') + '/', 'generated_at': datetime.now(timezone.utc).isoformat(),
        'expected_versions': len(versions), 'versions': versions,
        'skipped_versions': skipped, 'published_versions': len(projects), 'arxiv_only': arxiv_only}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path('.'))
    parser.add_argument('--site', type=Path, required=True)
    parser.add_argument('--source-sha', required=True)
    parser.add_argument('--repository', default='ReductTech/PaperSkill')
    parser.add_argument('--base-url', default='https://reducttech.github.io/PaperSkill/')
    parser.add_argument('--policy', type=Path, required=True)
    parser.add_argument('--arxiv-only', action='store_true')
    args = parser.parse_args()
    policy = json.loads(args.policy.read_text(encoding='utf-8-sig'))
    value = make_manifest(args.source, args.site, args.repository, args.source_sha, args.base_url, policy, arxiv_only=args.arxiv_only)
    (args.site / 'score-manifest.json').write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as stream:
            stream.write(f"score_count={value['expected_versions']}\n")
    print(f"Scoring manifest: {value['expected_versions']} queued, {len(value['skipped_versions'])} skipped, {value['published_versions']} published")


if __name__ == '__main__':
    main()
