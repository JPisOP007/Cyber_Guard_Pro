const nodemailer = require("nodemailer");

function buildTransport() {
    const provider = (process.env.MAIL_PROVIDER || 'gmail').toLowerCase();
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error("EMAIL_USER or EMAIL_PASS not set. Configure mailer env vars.");
    }

    if (provider === 'smtp') {
        // Generic SMTP provider
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const secure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
        if (!host) throw new Error('SMTP_HOST not set for MAIL_PROVIDER=smtp');
        return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    }

    // Default to Gmail service
    return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

async function sendWelcomeEmail(toEmail, firstname) {
    try {
        const transporter = buildTransport();

    // Email HTML body
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Cyber Guard Pro</title>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .email-container {
            max-width: 650px;
            width: 100%;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .email-container:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
        }
        
        /* Header Section */
        .header {
            background: linear-gradient(135deg, #8B5A2B 0%, #D2691E 50%, #FF7F24 100%);
            padding: 40px 30px 60px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
            transform: rotate(30deg);
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }
        
        .potato-container {
            position: relative;
            margin-right: 15px;
        }
        
        .cute-potato {
            width: 80px;
            height: 80px;
            filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.2));
            animation: float 3s ease-in-out infinite;
        }
        
        .potato-face {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 20px;
        }
        
        .eye {
            position: absolute;
            width: 6px;
            height: 6px;
            background: #5D4037;
            border-radius: 50%;
            top: 5px;
        }
        
        .eye-left {
            left: 8px;
        }
        
        .eye-right {
            right: 8px;
        }
        
        .smile {
            position: absolute;
            width: 20px;
            height: 8px;
            border-bottom: 3px solid #5D4037;
            border-radius: 0 0 10px 10px;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
        }
        
        .logo-text {
            font-size: 32px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .welcome-heading {
            font-size: 36px;
            margin: 15px 0 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            position: relative;
            z-index: 2;
        }
        
        .subheading {
            font-size: 18px;
            opacity: 0.95;
            max-width: 80%;
            margin: 0 auto;
            font-weight: 300;
            position: relative;
            z-index: 2;
        }
        
        /* Content Section */
        .content {
            padding: 40px 35px;
            color: #333;
            line-height: 1.6;
        }
        
        .greeting {
            font-size: 20px;
            margin-bottom: 25px;
            color: #5D4037;
            font-weight: 600;
        }
        
        .content h2 {
            color: #8B5A2B;
            margin: 25px 0 15px;
            font-size: 24px;
            font-weight: 600;
            position: relative;
            padding-left: 15px;
        }
        
        .content h2::before {
            content: "";
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 5px;
            height: 24px;
            background: linear-gradient(to bottom, #8B5A2B, #D2691E);
            border-radius: 3px;
        }
        
        .content p {
            margin-bottom: 20px;
            font-size: 16px;
            color: #555;
            line-height: 1.7;
        }
        
        .features {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin: 30px 0;
            gap: 15px;
        }
        
        .feature {
            flex-basis: calc(50% - 10px);
            background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 15px;
            border-left: 4px solid #D2691E;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        
        .feature h3 {
            color: #8B5A2B;
            font-size: 17px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        
        .feature h3::before {
            content: "✓";
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            background: #8B5A2B;
            color: white;
            border-radius: 50%;
            font-size: 12px;
            margin-right: 10px;
        }
        
        .feature p {
            font-size: 14px;
            color: #666;
            margin: 0;
        }
        
        .cta-section {
            text-align: center;
            margin: 35px 0 25px;
            padding: 25px;
            background: linear-gradient(135deg, #f9f5f0 0%, #f0e6d9 100%);
            border-radius: 16px;
            border: 1px solid rgba(210, 105, 30, 0.2);
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(to right, #8B5A2B, #D2691E);
            color: white;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(139, 90, 43, 0.3);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .cta-button::after {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }
        
        .cta-button:hover {
            background: linear-gradient(to right, #A0522D, #CD853F);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 90, 43, 0.4);
        }
        
        .cta-button:hover::after {
            left: 100%;
        }
        
        /* Footer Section */
        .footer {
            background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
            color: #fff;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .footer-potato {
            width: 30px;
            height: 30px;
            margin-right: 10px;
        }
        
        .footer-text {
            font-size: 18px;
            font-weight: 600;
        }
        
        .social-links {
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        
        .social-links a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            color: #fff;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .social-links a:hover {
            background: #D2691E;
            transform: translateY(-2px);
        }
        
        .footer-links {
            margin: 15px 0;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .footer-links a {
            color: #D2691E;
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .footer-links a:hover {
            color: #FF7F24;
            text-decoration: underline;
        }
        
        .copyright {
            margin-top: 20px;
            opacity: 0.7;
            font-size: 12px;
            line-height: 1.5;
        }
        
        /* Animations */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 650px) {
            body {
                padding: 10px;
            }
            
            .email-container {
                border-radius: 16px;
            }
            
            .header {
                padding: 30px 20px 50px;
            }
            
            .welcome-heading {
                font-size: 28px;
            }
            
            .subheading {
                font-size: 16px;
                max-width: 90%;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .feature {
                flex-basis: 100%;
            }
            
            .cta-section {
                padding: 20px;
            }
            
            .footer {
                padding: 25px 20px;
            }
            
            .footer-links {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo-container">
                <div class="potato-container">
                    <!-- Cute Potato SVG -->
                    <img src="https://png.pngtree.com/png-vector/20240531/ourmid/pngtree-cute-potato-mascot-character-png-image_12569193.png" alt="" width="100" />
                </div> 
                <div class="logo-text">Cyber Guard Pro</div>
            </div>
            <h1 class="welcome-heading">Welcome to Cyber Guard Pro!</h1>
            <p class="subheading">Your digital security, powered by our potato-inspired protection!</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hello ${firstname},</p>
            <p>We're thrilled to welcome you to Cyber Guard Pro! Your account has been successfully created, and you're now part of our community dedicated to top-notch cybersecurity.</p>
            
            <p>Just like a reliable potato that nourishes and sustains, Cyber Guard Pro works tirelessly in the background to protect your digital life from threats.</p>
            
            <h2>Get Started with These Features</h2>
            <div class="features">
                <div class="feature">
                    <h3>Advanced Threat Protection</h3>
                    <p>Real-time scanning and blocking of malware, ransomware, and phishing attempts.</p>
                </div>
                <div class="feature">
                    <h3>Gamified Experience</h3>
                    <p>Play Games and Learn about how hackers hack you with certificate.</p>
                </div>
                <div class="feature">
                    <h3>Quick Web Scan</h3>
                    <p>Scan the website you feel sussy, just in one potato button smash.</p>
                </div>
                <div class="feature">
                    <h3>Protection</h3>
                    <p>Constantly scans your computer and notify if any issues got detected.</p>
                </div>
            </div>
            
            <div class="cta-section">
                <p>Ready to secure your digital world? Click below to set up your protection:</p>
                <a href="https://cyber-guard-pro.onrender.com/" class="cta-button">Access Your Dashboard</a>
            </div>
            
            <p>If you have any questions or need assistance, our support team is here to help at <strong>support@cyberguardpro.com</strong>.</p>
            
            <p>Stay secure,<br><strong>The Cyber Guard Pro Team</strong></p>
        </div>
        
        <div class="footer">
            <div class="footer-logo">
                <div class="footer-text">Cyber Guard Pro</div>
            </div>
            <p>Security You Can Count On</p>
            <div class="footer-links">
                <a href="https://cyber-guard-pro.onrender.com/">Website</a>
                <a href="mailto:tatsypotato@gmail.com">Support</a>
            </div>
            <p class="copyright">© 2025 Cyber Guard Pro. All rights reserved.<br>You're receiving this email because you registered for Cyber Guard Pro.</p>
        </div>
    </div>
</body>
</html>
    `;

            const mailOptions = {
                from: `"Cyber Guard Pro" <${process.env.EMAIL_USER}>`,
                to: toEmail,
                subject: "🎉 Welcome to Cyber Guard Pro!",
                html: emailHtml,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${toEmail}. Provider=${process.env.MAIL_PROVIDER || 'gmail'} Response=${info.response || info.messageId}`);
  } catch (error) {
            console.error("❌ Error sending email:", error.message || error);
            if (process.env.NODE_ENV === 'development') {
                console.error(error.stack);
            }
  }
}

module.exports = sendWelcomeEmail;
