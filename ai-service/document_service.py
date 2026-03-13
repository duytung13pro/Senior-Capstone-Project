import asyncio
from pathlib import Path
from config import logger

async def convert_to_pdf(input_path: Path, output_dir: Path) -> Path:
    """Converts a document to PDF using LibreOffice."""
    cmd = [
        "libreoffice",
        "--headless",
        "--convert-to",
        "pdf",
        str(input_path),
        "--outdir",
        str(output_dir)
    ]
    
    # Run conversion in a separate thread to avoid blocking event loop
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    
    if process.returncode != 0:
        logger.error(f"LibreOffice conversion failed: {stderr.decode()}")
        raise Exception("Document conversion failed")
        
    # Valid output file
    # LibreOffice keeps original filename but changes extension to .pdf
    output_filename = input_path.stem + ".pdf"
    return output_dir / output_filename
