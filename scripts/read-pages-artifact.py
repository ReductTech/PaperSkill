"""Verify the original Actions ZIP, then inspect its Pages TAR."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
import tarfile
import tempfile
import zipfile


def inspect(archive):
    archive_size = archive.stat().st_size
    indexes = {}
    catalog = None
    names = set()
    with archive.open('rb') as stream:
        archive_digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        stream.seek(0)
        # upload-pages-artifact publishes an uncompressed tar.
        with tarfile.open(fileobj=stream, mode='r:') as tar:
            for item in tar:
                name = item.name.removeprefix('./').rstrip('/')
                if name in ('', '.') and item.isdir():
                    continue
                if (any(part in ('', '.', '..') for part in name.split('/'))
                        or '\\' in name or name in names or not (item.isfile() or item.isdir())):
                    raise ValueError(f'Invalid Pages artifact entry: {name!r}')
                names.add(name)
                # TarFile iteration can seek past EOF without reading a member.
                if item.offset_data + item.size > archive_size:
                    raise ValueError(f'Truncated Pages artifact entry: {name!r}')
                if not item.isfile():
                    continue
                if name == 'papers.json':
                    if not 0 < item.size <= 16 * 1024 * 1024:
                        raise ValueError('Invalid catalog size')
                    catalog = json.load(tar.extractfile(item))
                if re.fullmatch(r'papers/[^/]+/[^/]+/index\.html', name):
                    if item.size == 0:
                        raise ValueError(f'Empty tutorial page: {name}')
                    indexes[name.removesuffix('/index.html')] = hashlib.file_digest(
                        tar.extractfile(item), 'sha256').hexdigest()
            # Require the terminating zero records as well as complete members.
            stream.seek(tar.offset)
            if stream.read(1024) != b'\0' * 1024:
                raise ValueError('Pages artifact is missing its tar terminator')
    if not isinstance(catalog, list) or not catalog or not indexes:
        raise ValueError('Pages artifact has no catalog or version pages')
    return {'tar_sha256': archive_digest, 'catalog': catalog, 'indexes': indexes}


def inspect_verified_zip(archive, expected_digest):
    if not re.fullmatch(r'[0-9a-f]{64}', expected_digest):
        raise ValueError('Missing or invalid trusted ZIP SHA-256')
    with archive.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != expected_digest:
            raise ValueError('GitHub Pages artifact ZIP SHA-256 mismatch')
        stream.seek(0)
        with zipfile.ZipFile(stream) as bundle:
            if bundle.namelist() != ['artifact.tar']:
                raise ValueError('Pages ZIP must contain exactly artifact.tar')
            with tempfile.TemporaryDirectory(dir=archive.parent) as directory:
                tar = Path(directory) / 'artifact.tar'
                with bundle.open('artifact.tar') as member, tar.open('wb') as output:
                    shutil.copyfileobj(member, output)
                return inspect(tar)


if __name__ == '__main__':
    print(json.dumps(inspect_verified_zip(Path(sys.argv[1]), sys.argv[2])))
