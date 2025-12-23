from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import requests # <--- NEW LIBRARY
import random
import os

app = Flask(__name__, static_url_path='', static_folder='.')

# --- EMAILJS CONFIGURATION ---
# Replace these with your actual EmailJS keys
EMAILJS_SERVICE_ID = "service_rgxfs9o" 
EMAILJS_TEMPLATE_ID = "template_7m5vyuj"
EMAILJS_USER_ID = "QTYpAJGfLL6Wx5GRt" # This is your Public Key
EMAILJS_PRIVATE_KEY = "S8ZCy-j38GyIAqvBSFjPU" # This is your Private Key

# TEMPORARY STORAGE FOR OTPS
otp_storage = {} 

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    roll_input = str(data.get('rollNumber')).strip()
    email_input = str(data.get('email')).strip().lower()

    if not os.path.exists('students.csv'):
        return jsonify({"success": False, "message": "Database not found."}), 500

    # Read Database
    try:
        df = pd.read_csv('students.csv')
        df['roll'] = df['roll'].astype(str).str.strip()
        df['email'] = df['email'].astype(str).str.strip().str.lower()
    except Exception as e:
        return jsonify({"success": False, "message": f"CSV Error: {str(e)}"}), 500

    # Validate User
    student = df[df['roll'] == roll_input]

    if student.empty:
        return jsonify({"success": False, "message": "Roll Number not found."}), 404
    
    registered_email = student.iloc[0]['email']
    name = student.iloc[0]['name']
    
    if registered_email != email_input:
         return jsonify({"success": False, "message": "Email does not match our records."}), 401

    # Generate OTP
    otp = random.randint(1000, 9999)
    otp_storage[roll_input] = otp 
    
    # --- SEND VIA EMAILJS API ---
    # This is the "Deployment Proof" way
    try:
        payload = {
            "service_id": EMAILJS_SERVICE_ID,
            "template_id": EMAILJS_TEMPLATE_ID,
            "user_id": EMAILJS_USER_ID,
            "accessToken": EMAILJS_PRIVATE_KEY,
            "template_params": {
                "to_email": registered_email,
                "to_name": name,
                "otp": otp
            }
        }
        
        response = requests.post(
            "https://api.emailjs.com/api/v1.0/email/send", 
            json=payload
        )

        if response.status_code == 200:
            return jsonify({"success": True, "message": "OTP sent via EmailJS!"})
        else:
            print(f"EmailJS Error: {response.text}")
            return jsonify({"success": False, "message": "Failed to send email."}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"success": False, "message": "System Error"}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    roll_input = str(data.get('rollNumber')).strip()
    user_otp = int(data.get('otp'))

    if roll_input in otp_storage:
        correct_otp = otp_storage[roll_input]
        
        if user_otp == correct_otp:
            try:
                df = pd.read_csv('students.csv')
                df['roll'] = df['roll'].astype(str).str.strip()
                student_data = df[df['roll'] == roll_input].iloc[0]
                
                user_details = {
                    "name": str(student_data['name']),
                    "roll": str(student_data['roll']),
                    "branch": str(student_data['branch']),
                    "year": str(student_data['year'])
                }
                
                del otp_storage[roll_input] 
                return jsonify({"success": True, "message": "Login Successful!", "user": user_details})
            
            except Exception as e:
                return jsonify({"success": False, "message": f"Data Error: {str(e)}"}), 500
        else:
            return jsonify({"success": False, "message": "Invalid OTP."})
    else:
        return jsonify({"success": False, "message": "Session expired."})

if __name__ == '__main__':
    app.run(debug=True)