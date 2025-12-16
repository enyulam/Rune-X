"""Script to check PaddleOCR installation status."""
import sys

print("=" * 60)
print("PaddleOCR Installation Check")
print("=" * 60)

# Check 1: Import paddleocr
print("\n1. Checking if paddleocr module can be imported...")
try:
    import paddleocr
    print("   [OK] paddleocr module found")
    try:
        version = paddleocr.__version__
        print(f"   Version: {version}")
    except:
        print("   Version: unknown")
except ImportError as e:
    print(f"   [X] paddleocr module NOT found")
    print(f"   Error: {e}")

# Check 2: Import PaddleOCR class
print("\n2. Checking if PaddleOCR class can be imported...")
try:
    from paddleocr import PaddleOCR
    print("   [OK] PaddleOCR class can be imported")
except ImportError as e:
    print(f"   [X] PaddleOCR class cannot be imported")
    print(f"   Error: {e}")

# Check 3: Check paddlepaddle dependency
print("\n3. Checking paddlepaddle dependency...")
try:
    import paddle
    print("   [OK] paddlepaddle found")
    try:
        version = paddle.__version__
        print(f"   Version: {version}")
    except:
        print("   Version: unknown")
except ImportError as e:
    print(f"   [X] paddlepaddle NOT found")
    print(f"   Error: {e}")

# Check 4: Try to initialize (this will download models if needed)
print("\n4. Testing PaddleOCR initialization...")
try:
    from paddleocr import PaddleOCR
    print("   Attempting to initialize PaddleOCR (this may take a moment)...")
    ocr = PaddleOCR(use_textline_orientation=True, lang='ch')
    print("   [OK] PaddleOCR initialized successfully!")
except Exception as e:
    print(f"   [X] Failed to initialize PaddleOCR")
    print(f"   Error: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
print("Installation check complete")
print("=" * 60)
