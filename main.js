const calendar = document.getElementById("calendar");
const quranText = document.getElementById("quran-text");
const prayerList = document.getElementById("prayer-list");
const showQuranButton = document.getElementById("show-quran");
const markQuranButton = document.getElementById("mark-quran");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

// بيانات الأيام الـ30 (يمكن استبدالها ببيانات من قاعدة بيانات)
const data = {};
for (let day = 1; day <= 30; day++) {
  data[day] = {
    quranPart: `الجزء ${day}: من سورة ... إلى سورة ...`, // يمكنك إضافة النصوص الفعلية
    prayers: [
      { name: "الفجر", rakats: 2, sunnah: 2, completed: false },
      { name: "الظهر", rakats: 4, sunnah: 4, completed: false },
      { name: "العصر", rakats: 4, sunnah: 0, completed: false },
      { name: "المغرب", rakats: 3, sunnah: 2, completed: false },
      { name: "العشاء", rakats: 4, sunnah: 2, completed: false },
    ],
    quranCompleted: false, // إضافة حالة إنجاز قراءة القرآن
  };
}

// تحميل البيانات المحفوظة من localStorage
const savedData = JSON.parse(localStorage.getItem("ramadanData")) || data;

// إنشاء أيام رمضان ديناميكيًا
for (let day = 1; day <= 30; day++) {
  const dayElement = document.createElement("div");
  dayElement.className =
    savedData[day].prayers.every((p) => p.completed) &&
    savedData[day].quranCompleted
      ? "day completed quran-completed"
      : "day";
  dayElement.textContent = `اليوم ${day}`;
  dayElement.setAttribute("data-day", day);
  calendar.appendChild(dayElement);
}

// عرض تفاصيل اليوم عند النقر على يوم
calendar.addEventListener("click", (event) => {
  if (event.target.classList.contains("day")) {
    const dayNumber = event.target.getAttribute("data-day");
    const dayData = savedData[dayNumber];

    // إزالة النشاط من جميع الأيام
    document
      .querySelectorAll(".day")
      .forEach((day) => day.classList.remove("active"));
    // إضافة النشاط إلى اليوم المحدد
    event.target.classList.add("active");

    // عرض جزء القرآن
    quranText.textContent = dayData.quranPart;

    // تحديث زر "تمت القراءة"
    markQuranButton.textContent = dayData.quranCompleted
      ? "إلغاء القراءة"
      : "تمت القراءة";

    // عرض الصلوات
    prayerList.innerHTML = "";
    dayData.prayers.forEach((prayer, index) => {
      const li = document.createElement("li");
      li.className = prayer.completed ? "completed" : "";
      li.innerHTML = `
                <span>${prayer.name}: ${prayer.rakats} ركعات (${
        prayer.sunnah
      } سنة)</span>
                <button onclick="togglePrayer(${dayNumber}, ${index})">${
        prayer.completed ? "إلغاء" : "تم"
      }</button>
            `;
      prayerList.appendChild(li);
    });

    // تحديث نسبة الإنجاز
    updateProgress(dayData.prayers, dayData.quranCompleted);
  }
});

// تبديل حالة الصلاة (تم/إلغاء)
window.togglePrayer = (dayNumber, prayerIndex) => {
  savedData[dayNumber].prayers[prayerIndex].completed =
    !savedData[dayNumber].prayers[prayerIndex].completed;
  localStorage.setItem("ramadanData", JSON.stringify(savedData));

  // تحديث الواجهة
  const dayElement = document.querySelector(`.day[data-day="${dayNumber}"]`);
  if (
    savedData[dayNumber].prayers.every((p) => p.completed) &&
    savedData[dayNumber].quranCompleted
  ) {
    dayElement.classList.add("completed", "quran-completed");
  } else {
    dayElement.classList.remove("completed", "quran-completed");
  }

  // تحديث قائمة الصلوات
  const li = prayerList.children[prayerIndex];
  li.classList.toggle("completed");
  li.querySelector("button").textContent = savedData[dayNumber].prayers[
    prayerIndex
  ].completed
    ? "إلغاء"
    : "تم";

  // تحديث نسبة الإنجاز
  updateProgress(
    savedData[dayNumber].prayers,
    savedData[dayNumber].quranCompleted
  );
};

// تحديث حالة قراءة القرآن
function toggleQuranCompletion(dayNumber) {
  savedData[dayNumber].quranCompleted = !savedData[dayNumber].quranCompleted;
  localStorage.setItem("ramadanData", JSON.stringify(savedData));

  // تحديث الواجهة
  const dayElement = document.querySelector(`.day[data-day="${dayNumber}"]`);
  if (savedData[dayNumber].quranCompleted) {
    dayElement.classList.add("quran-completed");
  } else {
    dayElement.classList.remove("quran-completed");
  }

  // تحديث زر "تمت القراءة"
  markQuranButton.textContent = savedData[dayNumber].quranCompleted
    ? "إلغاء القراءة"
    : "تمت القراءة";

  // تحديث نسبة الإنجاز
  updateProgress(
    savedData[dayNumber].prayers,
    savedData[dayNumber].quranCompleted
  );
}

// إضافة حدث للزر "تمت القراءة"
markQuranButton.addEventListener("click", () => {
  const dayNumber = document
    .querySelector(".day.active")
    ?.getAttribute("data-day");
  if (dayNumber) {
    toggleQuranCompletion(dayNumber);
  } else {
    alert("الرجاء اختيار يوم أولاً.");
  }
});

// تحديث نسبة الإنجاز
function updateProgress(prayers, quranCompleted) {
  const completedPrayers = prayers.filter((p) => p.completed).length;
  const totalPrayers = prayers.length;
  const quranProgress = quranCompleted ? 1 : 0;

  // نسبة الإنجاز الكلية (50% للصلوات و 50% للقرآن)
  const totalProgress =
    (completedPrayers / totalPrayers) * 50 + quranProgress * 50;
  progressBar.value = totalProgress;
  progressText.textContent = `${totalProgress.toFixed(0)}%`;
}

// دالة لجلب النص الكامل للجزء المحدد
async function fetchQuranText(part) {
  try {
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_juz/${part}?language=ar`
    );
    const data = await response.json();
    return data.verses.map((verse) => verse.text_uthmani).join(" ");
  } catch (error) {
    console.error("حدث خطأ أثناء جلب النص:", error);
    return "تعذر تحميل النص. الرجاء المحاولة لاحقًا.";
  }
}

// عرض النص الكامل عند النقر على الزر
showQuranButton.addEventListener("click", async () => {
  const dayNumber = document
    .querySelector(".day.active")
    ?.getAttribute("data-day");
  if (dayNumber) {
    const quranContent = document.getElementById("quran-content");
    quranContent.textContent = "جاري تحميل النص...";
    const text = await fetchQuranText(dayNumber);
    quranContent.textContent = text;
    document.getElementById("full-quran").style.display = "block";
  } else {
    alert("الرجاء اختيار يوم أولاً.");
  }
});

// أوقات الصلوات الافتراضية (يمكن استبدالها ببيانات من API)
const prayerTimes = {
  fajr: "05:00",
  dhuhr: "12:30",
  asr: "15:45",
  maghrib: "18:20",
  isha: "19:45",
};

// دالة لإرسال إشعار عند دخول وقت الصلاة
function sendPrayerNotification(prayerName, prayerTime) {
  const now = new Date();
  const [hours, minutes] = prayerTime.split(":");
  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0, 0);

  const timeDifference = prayerDate - now;
  if (timeDifference > 0) {
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(`وقت صلاة ${prayerName}`, {
          body: `حان وقت صلاة ${prayerName}!`,
          icon: "https://example.com/prayer-icon.png", // يمكنك إضافة أيقونة
        });
      }
    }, timeDifference);
  }
}

// إرسال إشعارات تلقائية لجميع الصلوات
function setAutoPrayerNotifications() {
  sendPrayerNotification("الفجر", prayerTimes.fajr);
  sendPrayerNotification("الظهر", prayerTimes.dhuhr);
  sendPrayerNotification("العصر", prayerTimes.asr);
  sendPrayerNotification("المغرب", prayerTimes.maghrib);
  sendPrayerNotification("العشاء", prayerTimes.isha);
}

// طلب إذن الإشعارات
function requestNotificationPermission() {
  if (Notification.permission !== "granted") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("تم منح الإذن لإرسال الإشعارات.");
        setAutoPrayerNotifications(); // بدء إرسال الإشعارات بعد منح الإذن
      }
    });
  } else {
    setAutoPrayerNotifications(); // بدء إرسال الإشعارات إذا كان الإذن مُمنحًا مسبقًا
  }
}

// بدء طلب الإذن عند تحميل الصفحة
requestNotificationPermission();
