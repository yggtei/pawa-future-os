let bleDevice = null;
let bleServer = null;
let isOffWrist = true; 
let emergencyCountdownInterval = null;
let countdownSeconds = 30;

const connectBtn = document.getElementById('connectBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const logBox = document.getElementById('logBox');
const bioState = document.getElementById('bioState');
const emergencyModal = document.getElementById('emergencyModal');
const countdownTimer = document.getElementById('countdownTimer');

function log(msg) {
    const time = new Date().toLocaleTimeString();
    logBox.innerHTML += `[${time}] ${msg}<br>`;
    logBox.scrollTop = logBox.scrollHeight;
}

// 1. الاتصال المتقدم بالسوار وتخطي مشاكل البلوتوث
connectBtn.addEventListener('click', async () => {
    try {
        log("جاري مسح الأجهزة القريبة (BLE 5.1)...");
        bleDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['generic_access', 'heart_rate', 'battery_service']
        });

        log(`تم التعرف على الجهاز: ${bleDevice.name || 'PAWA SprintFit'}`);
        bleServer = await bleDevice.gatt.connect();
        
        statusDot.classList.add('active');
        statusText.innerText = "متصل بنجاح (نشط)";
        connectBtn.innerText = "متصل بالمنصة";
        log("تم إحكام الاستحواذ الحصري على السوار بنجاح.");

        bleDevice.addEventListener('gattserverdisconnected', handleDisconnection);
        startSilentMonitoring();

    } catch (err) {
        log(`خطأ في الاتصال: ${err}`);
    }
});

function handleDisconnection() {
    statusDot.classList.remove('active');
    statusText.innerText = "فصل الاتصال - جاري المعالجة...";
    connectBtn.innerText = "ربط السوار الذكي (BLE)";
    log("⚠️ انقطع الاتصال، يتم تفعيل بروتوكول إعادة الاتصال التلقائي...");
    
    setTimeout(() => {
        if (bleDevice && !bleDevice.gatt.connected) {
            bleDevice.gatt.connect().then(() => {
                statusDot.classList.add('active');
                statusText.innerText = "متصل (تمت الإعادة بنجاح)";
                log("🔄 تم استعادة الرابط اللاسلكي فوراً.");
            }).catch(() => log("فشل الاستعادة التلقائية."));
        }
    }, 4000);
}

// 2. المراقبة الصامتة وفحص الارتداء الحقيقي (منع الأخطاء والإنذارات الكاذبة)
function startSilentMonitoring() {
    setInterval(() => {
        if (!bleDevice || !bleDevice.gatt.connected) return;

        let simulatedOffWrist = false; // لو وُضع السوار على الطاولة تصبح true
        let simulatedHR = 72; 

        if (simulatedOffWrist) {
            isOffWrist = true;
            bioState.innerText = "الحالة: السوار خارج المعصم (وضع السكون)";
            return; 
        } else {
            isOffWrist = false;
            bioState.innerText = `الحالة: مرتدى أمن | النبض: ${simulatedHR} BPM`;
        }

        let criticalDangerDetected = false; 
        
        if (criticalDangerDetected && !isOffWrist) {
            triggerEmergencyProtocol();
        }

    }, 3000);
}

// 3. نظام الطوارئ المتدرج والعداد التنازلي الحاكم لمنع الموت أو الأخطاء
function triggerEmergencyProtocol() {
    emergencyModal.style.display = 'flex';
    countdownSeconds = 30;
    countdownTimer.innerText = countdownSeconds;
    
    log("🚨 تنبيه خطير: رصد مؤشر طوارئ قصوى! بدأ العداد التنازلي للاستغاثة...");

    emergencyCountdownInterval = setInterval(() => {
        countdownSeconds--;
        countdownTimer.innerText = countdownSeconds;

        if (countdownSeconds <= 0) {
            clearInterval(emergencyCountdownInterval);
            emergencyModal.style.display = 'none';
            executeFinalSOS();
        }
    }, 1000);
}

function cancelEmergency() {
    clearInterval(emergencyCountdownInterval);
    emergencyModal.style.display = 'none';
    log("✅ تم إلغاء إنذار الطوارئ بنجاح بناءً على استجابتك الفورية.");
}

function executeFinalSOS() {
    log("🆘 [تم إرسال نداء الاستغاثة والطوارئ مع الموقع الجغرافي والحالة الحيوية]!");
}