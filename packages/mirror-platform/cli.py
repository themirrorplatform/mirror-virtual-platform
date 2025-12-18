"""
Mirror CLI Interface

Command-line interface for interacting with Mirror.

Usage:
    mirror start                    # Start interactive session
    mirror reflect "your thoughts"  # Quick reflection
    mirror status                   # Check system status
    mirror config show              # Show configuration
    mirror serve                    # Start API server
"""

import asyncio
import sys
from typing import Optional

try:
    import click
except ImportError:
    click = None

from .config import (
    MirrorPlatformConfig,
    load_config,
    save_config,
    ensure_directories,
    get_config_path,
)
from .platform import Mirror, MirrorInstance, quick_reflect


def require_click(func):
    """Decorator to check if click is available."""
    def wrapper(*args, **kwargs):
        if click is None:
            print("Error: 'click' package is required for CLI.")
            print("Install with: pip install click")
            sys.exit(1)
        return func(*args, **kwargs)
    return wrapper


# Only define CLI if click is available
if click:

    @click.group()
    @click.version_option(version="1.0.0", prog_name="mirror")
    @click.pass_context
    def cli(ctx):
        """Mirror - Constitutional Boundary Layer for Intelligence

        Mirror helps you explore patterns in your thinking without
        judgment, diagnosis, or unsolicited advice.

        All interactions respect the 14 constitutional axioms.
        """
        ctx.ensure_object(dict)
        ctx.obj["config"] = load_config()

    @cli.command()
    @click.option("--user", "-u", default="default", help="User ID")
    @click.pass_context
    def start(ctx, user):
        """Start an interactive Mirror session.

        This begins a conversational session where you can share
        your thoughts and receive reflections.

        The session has time limits (45-minute warning, 90-minute limit)
        to encourage healthy usage patterns.
        """
        config = ctx.obj["config"]
        ensure_directories(config)

        click.echo("Starting Mirror...")
        click.echo("Type your thoughts and press Enter. Type 'quit' to exit.\n")

        asyncio.run(_interactive_session(config, user))

    async def _interactive_session(config: MirrorPlatformConfig, user_id: str):
        """Run an interactive session."""
        mirror = Mirror(config)
        await mirror.start()

        try:
            session = await mirror.begin(user_id)
            click.echo(f"Session started. ID: {session.id[:8]}...")
            click.echo("-" * 50)
            click.echo()

            while True:
                try:
                    user_input = click.prompt("You", default="", show_default=False)

                    if not user_input.strip():
                        continue

                    if user_input.lower() in ["quit", "exit", "bye", "goodbye"]:
                        break

                    result = await mirror.reflect(user_input)

                    if result.success:
                        click.echo()
                        click.echo(click.style("Mirror:", fg="blue"))
                        click.echo(result.text)
                        click.echo()

                        if result.break_suggested:
                            click.echo(click.style(
                                f"💭 {result.break_message}",
                                fg="yellow"
                            ))
                            click.echo()

                        if result.session_should_end:
                            click.echo(click.style(
                                "Session time limit reached.",
                                fg="yellow"
                            ))
                            break
                    else:
                        click.echo(click.style(
                            f"Error: {result.error}",
                            fg="red"
                        ))

                except (KeyboardInterrupt, EOFError):
                    break

            # End session
            click.echo()
            goodbye = await mirror.end()
            click.echo(click.style(goodbye, fg="green"))

        finally:
            await mirror.stop()

    @cli.command()
    @click.argument("text")
    @click.option("--user", "-u", default="default", help="User ID")
    @click.pass_context
    def reflect(ctx, text, user):
        """Get a quick reflection without an interactive session.

        Example:
            mirror reflect "I've been feeling overwhelmed at work"
        """
        config = ctx.obj["config"]

        async def _do_reflect():
            result = await quick_reflect(text, user)

            if result.success:
                click.echo(result.text)

                if result.break_suggested:
                    click.echo()
                    click.echo(click.style(
                        f"Note: {result.break_message}",
                        fg="yellow"
                    ))
            else:
                click.echo(click.style(f"Error: {result.error}", fg="red"))
                sys.exit(1)

        asyncio.run(_do_reflect())

    @cli.command()
    @click.pass_context
    def status(ctx):
        """Show Mirror system status."""
        config = ctx.obj["config"]

        click.echo("Mirror Status")
        click.echo("=" * 40)
        click.echo(f"Environment: {config.environment}")
        click.echo(f"Strict Mode: {config.strict_mode}")
        click.echo(f"Provider: {config.provider.default_provider}")
        click.echo(f"Storage: {config.storage.type}")
        click.echo()
        click.echo("Constitutional Axioms: 14 (all enforced)")

    @cli.group()
    def config():
        """Configuration management commands."""
        pass

    @config.command("show")
    @click.pass_context
    def config_show(ctx):
        """Show current configuration."""
        config = ctx.obj["config"]

        import json
        click.echo(json.dumps(config.to_dict(), indent=2))

    @config.command("path")
    def config_path():
        """Show configuration file path."""
        path = get_config_path()
        click.echo(f"Config path: {path}")
        click.echo(f"Exists: {path.exists()}")

    @config.command("init")
    @click.pass_context
    def config_init(ctx):
        """Initialize configuration with defaults."""
        config = MirrorPlatformConfig()
        path = get_config_path()

        if path.exists():
            if not click.confirm(f"Config exists at {path}. Overwrite?"):
                return

        ensure_directories(config)
        save_config(config, path)
        click.echo(f"Configuration saved to {path}")

    @config.command("set")
    @click.argument("key")
    @click.argument("value")
    @click.pass_context
    def config_set(ctx, key, value):
        """Set a configuration value.

        Example:
            mirror config set provider.default_provider ollama
        """
        config = ctx.obj["config"]

        # Parse dotted key
        parts = key.split(".")

        # Navigate to parent
        obj = config
        for part in parts[:-1]:
            if hasattr(obj, part):
                obj = getattr(obj, part)
            else:
                click.echo(click.style(f"Unknown key: {key}", fg="red"))
                return

        # Set value
        final_key = parts[-1]
        if hasattr(obj, final_key):
            # Type conversion
            current = getattr(obj, final_key)
            if isinstance(current, bool):
                value = value.lower() in ("true", "1", "yes")
            elif isinstance(current, int):
                value = int(value)

            setattr(obj, final_key, value)
            save_config(config)
            click.echo(f"Set {key} = {value}")
        else:
            click.echo(click.style(f"Unknown key: {key}", fg="red"))

    @cli.command()
    @click.option("--host", "-h", default="127.0.0.1", help="Host to bind to")
    @click.option("--port", "-p", default=8000, help="Port to listen on")
    @click.pass_context
    def serve(ctx, host, port):
        """Start the Mirror API server.

        This starts an HTTP server that provides REST API access
        to Mirror functionality.
        """
        config = ctx.obj["config"]
        config.api.host = host
        config.api.port = port

        click.echo(f"Starting Mirror API server on {host}:{port}")

        try:
            from .api import create_app
            import uvicorn

            app = create_app(config)
            uvicorn.run(app, host=host, port=port)
        except ImportError as e:
            click.echo(click.style(
                f"Error: Required package not installed: {e}",
                fg="red"
            ))
            click.echo("Install with: pip install fastapi uvicorn")
            sys.exit(1)

    @cli.command()
    def axioms():
        """Display the 14 constitutional axioms."""
        axioms = {
            1: ("Certainty", "Mirror does not convince, assert, or claim certainty about the user"),
            2: ("Sovereignty", "User is the final interpreter of their own experience"),
            3: ("Manipulation", "No dark patterns or manipulative techniques"),
            4: ("Diagnosis", "Never diagnose medical or psychological conditions"),
            5: ("Post-Action", "Only activated after explicit user action"),
            6: ("Necessity", "Minimal necessary analysis, no over-interpretation"),
            7: ("Exit Freedom", "User can always leave, immediately and unconditionally"),
            8: ("Departure Inference", "No inference or judgment from user departure"),
            9: ("Advice", "Never prescriptive advice, only reflection"),
            10: ("Context Collapse", "Private context stays private"),
            11: ("Certainty-Self", "No AI certainty claims about user psychology"),
            12: ("Optimization", "Not a tool for self-optimization"),
            13: ("Coercion", "No pressure tactics or guilt"),
            14: ("Capture", "No psychological capture or dependency creation"),
        }

        click.echo("The 14 Constitutional Axioms of Mirror")
        click.echo("=" * 50)
        click.echo()

        for num, (name, desc) in axioms.items():
            click.echo(f"{num:2}. {click.style(name, bold=True)}")
            click.echo(f"    {desc}")
            click.echo()

        click.echo("These axioms are IMMUTABLE and enforced at runtime.")

    def main():
        """Entry point for the CLI."""
        cli()

else:
    # Fallback if click is not available
    def main():
        print("Mirror CLI")
        print("=" * 40)
        print("The 'click' package is required for the CLI.")
        print("Install with: pip install click")
        print()
        print("Alternatively, use Mirror programmatically:")
        print()
        print("  from mirror_platform import Mirror")
        print("  mirror = Mirror()")
        print("  await mirror.start()")
        print("  response = await mirror.reflect('your thoughts')")
        sys.exit(1)


if __name__ == "__main__":
    main()
