# Mirror Virtual Platform - Setup Script

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="mirror-virtual-platform",
    version="0.1.0",
    author="The Mirror Platform",
    description="Constitutional AI platform for authentic reflection",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/themirrorplatform/mirror-virtual-platform",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.9",
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.5.0",
        "cryptography>=41.0.7",
        "python-dateutil>=2.8.2",
    ],
    extras_require={
        "voice": ["openai-whisper>=20231117"],
        "video": ["opencv-python>=4.8.1"],
        "claude": ["anthropic>=0.7.0"],
        "openai": ["openai>=1.3.0"],
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "black>=23.11.0",
            "mypy>=1.7.1",
            "ruff>=0.1.6",
        ],
    },
    entry_points={
        "console_scripts": [
            "mirror=mirror_os.main:main",
        ],
    },
)
