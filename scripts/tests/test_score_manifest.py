import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('score_manifest', Path(__file__).resolve().parents[1] / 'create-score-manifest.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ManifestTests(unittest.TestCase):
    def fixture(self, root, *, linked=False):
        source, site = root / 'source', root / 'site'
        source.mkdir(); site.mkdir()
        metadata = []
        rows, catalog, tracked = [], [], []
        for index, (paper, identifier) in enumerate([('arxiv_paper', '1706.03762'), ('blog_paper', '')]):
            version = 'alice1030'
            blob = str(index + 1) * 40
            meta = dict(paperName=paper, version=version, title=paper, paperUrl='https://example.com/' + paper,
                        versionDate='2026-10-30', participants=[dict(name='Alice', github='alice')])
            data = json.dumps(meta).encode()
            metadata.append(blob.encode() + b' blob ' + str(len(data)).encode() + b'\n' + data + b'\n')
            tracked.extend([f'100644 blob {blob}\thtml_output/{paper}/{version}/paper.json',
                            f'100644 blob {blob}\thtml_output/{paper}/{version}/src/main.tsx'])
            directory = site / 'papers' / paper / version
            directory.mkdir(parents=True)
            (directory / 'index.html').write_text('<html>test</html>')
            catalog.append(dict(paperName=paper, versions=[dict(version=version)]))
            rows.append(dict(key=f'{paper}/{version}', status='ready' if identifier else 'skipped',
                             identifier=identifier, reason='missing_arxiv_id'))
        tracked.extend([f'{"120000" if linked else "100644"} blob {"d" * 40}\thtml_output/README.md',
                        f'100644 blob {"e" * 40}\thtml_output/arxiv_paper/README.md'])
        (site / 'papers.json').write_text(json.dumps({'papers': catalog}))
        return source, site, {'results': rows}, ('\0'.join(tracked) + '\0').encode(), b''.join(metadata)

    def test_documentation_is_not_a_project_and_excluded_versions_remain_published(self):
        with tempfile.TemporaryDirectory() as temp:
            source, site, policy, tree, blobs = self.fixture(Path(temp))
            with patch.object(module.subprocess, 'check_output', side_effect=['a' * 40, tree, blobs]):
                result = module.make_manifest(source, site, 'ReductTech/PaperSkill', 'a' * 40,
                                              'https://example.com/', policy, arxiv_only=True)
            self.assertEqual(result['published_versions'], 2)
            self.assertEqual(result['expected_versions'], 1)
            self.assertEqual(result['skipped_versions'][0]['key'], 'blog_paper/alice1030')
            self.assertEqual(result['versions'][0]['tutorial']['arxiv_id'], '1706.03762')
            self.assertTrue((site / 'papers/blog_paper/alice1030/index.html').exists())
            entry = result['versions'][0]
            self.assertEqual(entry['content_fingerprint'], module.digest({'source': entry['source_fingerprint'], 'files': entry['files']}))

    def test_linked_documentation_still_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            source, site, policy, tree, blobs = self.fixture(Path(temp), linked=True)
            with patch.object(module.subprocess, 'check_output', side_effect=['a' * 40, tree, blobs]):
                with self.assertRaisesRegex(ValueError, 'Linked'):
                    module.make_manifest(source, site, 'ReductTech/PaperSkill', 'a' * 40, 'https://example.com/', policy)

    def test_catalog_mismatch_is_not_silently_skipped(self):
        with tempfile.TemporaryDirectory() as temp:
            source, site, policy, tree, blobs = self.fixture(Path(temp))
            (site / 'papers.json').write_text('{"papers": []}')
            with patch.object(module.subprocess, 'check_output', side_effect=['a' * 40, tree, blobs]):
                with self.assertRaisesRegex(ValueError, 'differ'):
                    module.make_manifest(source, site, 'ReductTech/PaperSkill', 'a' * 40, 'https://example.com/', policy)

    def test_root_vite_export_does_not_become_another_version(self):
        with tempfile.TemporaryDirectory() as temp:
            source, site, policy, tree, blobs = self.fixture(Path(temp))
            root = 'html_output/arxiv_paper/'
            for path in ('index.html', 'assets/index-BaCpUBLM.js', 'images/figure.png'):
                tree += f'100644 blob {"c" * 40}\t{root}{path}\0'.encode()
            with patch.object(module.subprocess, 'check_output', side_effect=['a' * 40, tree, blobs]):
                result = module.make_manifest(source, site, 'ReductTech/PaperSkill', 'a' * 40,
                                              'https://example.com/', policy)
            self.assertEqual(result['published_versions'], 2)
            tree += f'100644 blob {"c" * 40}\t{root}bob1030/src/main.tsx\0'.encode()
            with patch.object(module.subprocess, 'check_output', side_effect=['a' * 40, tree, blobs]):
                with self.assertRaisesRegex(ValueError, 'Tracked version lacks paper.json'):
                    module.make_manifest(source, site, 'ReductTech/PaperSkill', 'a' * 40,
                                         'https://example.com/', policy)
