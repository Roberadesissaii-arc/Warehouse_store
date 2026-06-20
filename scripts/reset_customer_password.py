#!/usr/bin/env python3
"""Reset a Garage Store customer password (store/instance/store.db only)."""
from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

STORE_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = STORE_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app import create_app  # noqa: E402
from app.models import customer  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset Garage Store customer password")
    parser.add_argument("--email", help="Customer email (required for reset)")
    parser.add_argument("--password", help="New password (prompted if omitted)")
    parser.add_argument("--list", action="store_true", help="List customer emails and exit")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.list:
            emails = customer.list_usernames()
            if not emails:
                print("No customer accounts in the store database.")
            else:
                print("Store customer accounts:")
                for email in emails:
                    print(f"  - {email}")
            print(f"Database: {app.config['DATABASE']}")
            return 0

        if not args.email:
            print("--email is required unless you use --list", file=sys.stderr)
            return 1

        password = args.password
        if not password:
            password = getpass.getpass("New password: ")
            confirm = getpass.getpass("Confirm password: ")
            if password != confirm:
                print("Passwords do not match.", file=sys.stderr)
                return 1

        try:
            customer.reset_password(args.email, password)
        except ValueError as exc:
            print(exc, file=sys.stderr)
            print("Tip: run with --list to see emails in this database.", file=sys.stderr)
            return 1

        print(f"Password updated for {args.email}")
        print(f"Database: {app.config['DATABASE']}")
        print("WarehouseDB staff accounts are unchanged.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
