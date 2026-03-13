import requests
import json
import os
import time

BASE_URL = "http://localhost:8000"

def print_response(response, endpoint):
    print(f"\n--- Testing {endpoint} ---")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    return response.status_code == 200

def test_health():
    try:
        response = requests.get(f"{BASE_URL}/")
        return print_response(response, "GET / (Health Check)")
    except requests.exceptions.ConnectionError:
        print(f"\n[!] Could not connect to {BASE_URL}. Is the docker container running?")
        return False

def test_upload():
    # Create a dummy text file to upload
    filename = "test_document.txt"
    with open(filename, "w") as f:
        f.write("This is a test document about Artificial Intelligence in Education. AI can help students learn faster.")
    
    files = {'file': (filename, open(filename, 'rb'), 'text/plain')}
    data = {'courseId': 'test-course-123'}
    
    response = requests.post(f"{BASE_URL}/upload", files=files, data=data)
    
    # Cleanup
    os.remove(filename)
    return print_response(response, "POST /upload")

def test_tts():
    payload = {
        "text": "Hello, this is a test of the text to speech system.",
        "language": "en"
    }
    response = requests.post(f"{BASE_URL}/tts", json=payload)
    return print_response(response, "POST /tts")

def test_translate():
    payload = {
        "text": "Artificial Intelligence",
        "courseId": "test-course-123"
    }
    response = requests.post(f"{BASE_URL}/translate", json=payload)
    return print_response(response, "POST /translate")

def test_quiz():
    payload = {
        "topic": "Artificial Intelligence",
        "courseId": "test-course-123",
        "num_questions": 1
    }
    response = requests.post(f"{BASE_URL}/generate-quiz", json=payload)
    return print_response(response, "POST /generate-quiz")

if __name__ == "__main__":
    print("Waiting for service to be ready...")
    # Simple check loop
    for _ in range(5):
        if test_health():
            break
        time.sleep(2)
    
    test_upload()
    test_tts()
    test_translate()
    test_quiz()
