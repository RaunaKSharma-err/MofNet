#!/usr/bin/env python3
"""CLI script to ingest Nepal curriculum files into ChromaDB and SQLite."""

import argparse
from pathlib import Path

from app.core.logging import setup_logging
from app.database.init_db import init_db
from app.core.dependencies import get_ingestion_service, get_vector_store


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest HimalMesh curriculum into ChromaDB")
    parser.add_argument(
        "--dir",
        type=Path,
        default=None,
        help="Curriculum root directory (default: settings.curriculum_dir)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-ingest files even when content hash is unchanged",
    )
    args = parser.parse_args()

    setup_logging()
    init_db()

    service = get_ingestion_service()
    stats = service.ingest_curriculum_standalone(curriculum_dir=args.dir, force=args.force)
    vector_count = get_vector_store().count()

    print("Ingestion finished.")
    print(f"  Files processed : {stats.files_processed}")
    print(f"  Chunks created  : {stats.chunks_created}")
    print(f"  Chunks updated  : {stats.chunks_updated}")
    print(f"  Chunks skipped  : {stats.chunks_skipped}")
    print(f"  Vectors in store: {vector_count}")


if __name__ == "__main__":
    main()
