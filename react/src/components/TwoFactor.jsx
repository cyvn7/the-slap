import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";

const TwoFactor = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!location.state?.qrUrl || !location.state?.fromRegistration) {
            navigate('/');
            return;
        }
        setIsLoading(false);
    }, [location, navigate]);

    const qrUrl = location.state?.qrUrl;
    
    const handleOpenQrUrl = () => {
        if (qrUrl) {
            window.open(qrUrl, '_blank');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-container">
            <h2>Two Factor Authentication</h2>
            <p>Scan the QR code below with your authenticator app to enable 2FA.</p>
            <div style={{ height: "auto", margin: "0 auto", maxWidth: 256, width: "100%" }}>
                <QRCode
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={qrUrl || ''}
                    viewBox={`0 0 256 256`}
                />
            </div>
            <button onClick={handleOpenQrUrl}>Or click here!</button>
            <button onClick={() => navigate('/login')}>Done!</button>
        </div>
    );
};

export default TwoFactor;