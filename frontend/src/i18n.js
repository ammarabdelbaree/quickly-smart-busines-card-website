// i18n.js — Central translations for the entire Quickly app
// ─────────────────────────────────────────────────────────
// To add a new page:  add keys under en.yourPage + ar.yourPage
// To use in a component: const { t } = useTranslation(); then t.yourPage.key

export const translations = {
  // ════════════════════════════════════════════════════════
  //  ENGLISH
  // ════════════════════════════════════════════════════════
  en: {

    // ── Common / Shared ────────────────────────────────────
    common: {
      loading: "Loading…",
      error: "Something went wrong.",
      retry: "Try Again",
      poweredBy: "Powered by",
      brand: "Quickly",
      returnToProfile: "↩  Return to Profile",
      viewProfile: "← View profile",
      saving: "Saving...",
      saveChanges: "Save Changes",
      processing: "Processing...",
      verifying: "Verifying...",
    },

    // ── App.jsx screens ────────────────────────────────────
    app: {
      initializing: "Initializing Quickly...",
      notFound: "This is not the page you are looking for.",
      tagInactive: "This tag is currently inactive.",
      tagInactiveHelp: "Please contact support to reactivate it.",
    },

    // ── Home ───────────────────────────────────────────────
    home: {
      nav: {
        home: "HOME",
        createProfile: "CREATE PROFILE",
        cards: "CARDS",
        buyNow: "Buy Now",
      },
      hero: {
        tagline: "Quickly lets you create and share your smart digital business card instantly via NFC.",
      },
      cta: {
        title: "Create your own Quickly profile",
        description: "description",
        emailPlaceholder: "you@example.com",
        emailLabel: "Email Address",
        createAccount: "Create Account",
      },
      footer: {
        copyright: `© Quickly ${new Date().getFullYear()}`,
      },
    },

    // ── FirstScanPage ──────────────────────────────────────
    firstScan: {
      welcomePrefix: "Welcome to",
      subtitle: "Your smart digital journey starts here.",
      tagDetected: "Tag Detected:",
      securityCode: "Security Verification Code:",
      keepCode: "Keep this code handy!",
      keepCodeNote: "You will need it in the next step to prove ownership of this tag.",
      noCode: "⚠️ Verification code not found.",
      noCodeHelp: "Please refresh the page or try scanning the tag again.",
      claimTag: "Claim My Tag",
      secureText: "Secure end-to-end activation",
      copyTitle: "Copy to clipboard",
    },

    // ── RegisterPage ───────────────────────────────────────
    register: {
      titleNew: "Activate Your Card",
      titleExisting: "Sign In to Admin",
      subtitleNew: "Create your admin account to manage this card.",
      subtitleExisting: "Login with your existing account to claim this new card.",
      codeLabel: "Security Verification Code",
      codePlaceholder: "Enter the 6-digit code",
      emailLabel: "Email Address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholderNew: "Create a strong password",
      passwordPlaceholderExisting: "Enter your password",
      submitNew: "Activate Card",
      submitExisting: "Login & Claim",
      switchToLogin: "Already have a Quickly account? Log in",
      switchToRegister: "New user? Create an account instead",
      confirmTitle: "Check Your Email",
      confirmSubtitle: "Your account has been created!",
      confirmHint: "We sent a confirmation link to",
      confirmNote: "Please click the link in the email to activate your account, then come back and log in.",
      errors: {
        invalidEmail: "Please enter a valid email address.",
        shortPassword: "Password must be at least 6 characters.",
        noCode: "Verification code is required to claim this tag.",
        invalidCode: "The verification code is incorrect.",
        emailInUse: "An account with this email already exists.",
        tagClaimed: "This tag has already been claimed by someone else.",
        emailNotConfirmed: "Please confirm your email first. Check your inbox.",
        generic: "Email or password are incorrect. Please try again.",
      },
    },

    // ── AdminLoginPage ─────────────────────────────────────
    adminLogin: {
      title: "Admin Access",
      subtitle: "Manage your Quickly digital profile",
      emailLabel: "Email Address",
      emailPlaceholder: "name@company.com",
      passwordLabel: "Password",
      signIn: "Sign In",
      forgotPassword: "Forgot your password?",
      forgotHint: "Enter your email and we'll send you a reset link.",
      sendResetEmail: "Send Reset Email",
      resetEmailSent: "✅ Check your inbox! A password reset link has been sent.",
      errors: {
        emptyFields: "Please enter both email and password.",
        invalidCredential: "Incorrect email or password.",
        emailNotConfirmed: "Please confirm your email before logging in. Check your inbox.",
        tooManyRequests: "Too many failed attempts. Try again later.",
        generic: "Login failed. Please try again.",
        invalidEmail: "Please enter a valid email address.",
        resetFailed: "Failed to send reset email. Please try again.",
      },
    },

    // ── SetupPage ──────────────────────────────────────────
    setup: {
      title: "Edit Profile",
      profilePicLabel: "Profile Picture",
      coverPhotoLabel: "Cover Photo",
      nameLabel: "Name *",
      titleFieldLabel: "Title",
      descriptionLabel: "Description",
      emailLabel: "Email (Public)",
      emailAddLabel: "Add Email Address",
      phoneLabel: "Phone",
      phoneAddLabel: "Add Phone Number",
      socialMediaTitle: "Social Media",
      customLinksTitle: "Custom Links",
      addBtn: "+ Add",
      platformPlaceholder: "Platform",
      urlPlaceholder: "https://...",
      linkLabelPlaceholder: "Label (e.g. Portfolio)",
      linkUrlPlaceholder: "URL",
      successMsg: "Profile updated successfully!",
      errors: {
        notLoggedIn: "You must be logged in.",
        missingFields: "Name and phone number are required.",
        imageTooLarge: "Image must be 1.5MB or smaller.",
        saveFailed: "Failed to save. Please try again.",
      },
    },

    // ── PublicPage ─────────────────────────────────────────
    public: {
      saveContact: "Save Contact",
      shareProfile: "Share Profile",
      downloadQr: "Download QR Code",
      call: "Call",
      email: "Email",
      adminEdit: "Admin? Edit your profile.",
      errorMsg: "This Quickly profile isn't active yet. Please try again.",
      linkCopied: "Link copied to clipboard!",
    },

    // ── LandingChoicePage ──────────────────────────────────
    landingChoice: {
      welcomePrefix: "Welcome to",
      openProfile: "Open Profile",
      editProfile: "Edit Profile",
    },

    // ── AdminPanel ─────────────────────────────────────────
    adminPanel: {
      login: {
        title: "Admin Access",
        subtitle: "Enter your admin secret to continue",
        placeholder: "Admin secret",
        enterBtn: "Enter Panel",
        checking: "Checking...",
        invalidSecret: "Invalid admin secret.",
      },
      panel: {
        title: "Admin Panel",
        tagsTotal: "tags total",
        createTitle: "Create New Tag",
        tagIdPlaceholder: "Enter Tag ID",
        createBtn: "Create",
        allTagsTitle: "All Tags",
        searchPlaceholder: "Search by Tag ID or phone number...",
        loadingTags: "Loading tags...",
        noTagsFound: "No tags found.",
        cols: {
          tagId: "Tag ID",
          status: "Status",
          phone: "Phone",
          owner: "Owner",
          setup: "Setup",
          actions: "Actions",
        },
        deactivateBtn: "Deactivate",
        reactivateBtn: "Reactivate",
        confirmDeactivate: (id) => `Deactivate "${id}"? Users will see a "contact support" message.`,
        confirmDelete: (id) => `Delete "${id}"? The tag will be removed.`,
        loadFailed: (msg) => `Failed to load tags: ${msg}`,
        created: (id, code) => `✅ Tag "${id}" created! Code: ${code}`,
        deactivated: (id) => `Tag "${id}" deactivated.`,
        deleted: (id) => `Tag "${id}" deleted.`,
        reactivated: (id) => `✅ Tag "${id}" reactivated.`,
        noTagId: "Please enter a Tag ID.",
      },
      badges: {
        deactivated: "Deactivated",
        active: "Active",
        claimed: "Claimed",
        unclaimed: "Unclaimed",
      },
    },
  },

  // ════════════════════════════════════════════════════════
  //  ARABIC
  // ════════════════════════════════════════════════════════
  ar: {

    // ── Common / Shared ────────────────────────────────────
    common: {
      loading: "جارٍ التحميل…",
      error: "حدث خطأ ما.",
      retry: "حاول مجدداً",
      poweredBy: "مدعوم من",
      brand: "Quickly",
      returnToProfile: "↩  العودة إلى الملف الشخصي",
      viewProfile: "← عرض الملف الشخصي",
      saving: "جارٍ الحفظ...",
      saveChanges: "حفظ التغييرات",
      processing: "جارٍ المعالجة...",
      verifying: "جارٍ التحقق...",
    },

    // ── App.jsx screens ────────────────────────────────────
    app: {
      initializing: "جارٍ تشغيل Quickly...",
      notFound: "هذه ليست الصفحة التي تبحث عنها.",
      tagInactive: "هذه البطاقة غير نشطة حالياً.",
      tagInactiveHelp: "يرجى التواصل مع الدعم لإعادة تفعيلها.",
    },

    // ── Home ───────────────────────────────────────────────
    home: {
      nav: {
        home: "الرئيسية",
        createProfile: "إنشاء ملف شخصي",
        cards: "البطاقات",
        buyNow: "اشترِ الآن",
      },
      hero: {
        tagline: "Quickly تتيح لك إنشاء ومشاركة بطاقة عملك الرقمية الذكية فوراً عبر NFC.",
      },
      cta: {
        title: "أنشئ ملفك الشخصي على Quickly",
        description: "وصف",
        emailPlaceholder: "you@example.com",
        emailLabel: "البريد الإلكتروني",
        createAccount: "إنشاء حساب",
      },
      footer: {
        copyright: `© Quickly ${new Date().getFullYear()}`,
      },
    },

    // ── FirstScanPage ──────────────────────────────────────
    firstScan: {
      welcomePrefix: "مرحباً بك في",
      subtitle: "رحلتك الرقمية الذكية تبدأ من هنا.",
      tagDetected: "تم اكتشاف البطاقة:",
      securityCode: "رمز التحقق الأمني:",
      keepCode: "احتفظ بهذا الرمز!",
      keepCodeNote: "ستحتاج إليه في الخطوة التالية لإثبات ملكية هذه البطاقة.",
      noCode: "⚠️ لم يتم العثور على رمز التحقق.",
      noCodeHelp: "يرجى تحديث الصفحة أو تجربة مسح البطاقة مرة أخرى.",
      claimTag: "استلم بطاقتي",
      secureText: "تفعيل آمن من طرف إلى طرف",
      copyTitle: "نسخ إلى الحافظة",
    },

    // ── RegisterPage ───────────────────────────────────────
    register: {
      titleNew: "تفعيل بطاقتك",
      titleExisting: "تسجيل دخول المسؤول",
      subtitleNew: "أنشئ حساب المسؤول الخاص بك لإدارة هذه البطاقة.",
      subtitleExisting: "سجّل دخولك بحسابك الحالي للمطالبة بهذه البطاقة الجديدة.",
      codeLabel: "رمز التحقق الأمني",
      codePlaceholder: "أدخل الرمز المكوّن من 6 أرقام",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "you@example.com",
      passwordLabel: "كلمة المرور",
      passwordPlaceholderNew: "أنشئ كلمة مرور قوية",
      passwordPlaceholderExisting: "أدخل كلمة المرور",
      submitNew: "تفعيل البطاقة",
      submitExisting: "تسجيل الدخول والمطالبة",
      switchToLogin: "هل لديك حساب Quickly بالفعل؟ سجّل دخولك",
      switchToRegister: "مستخدم جديد؟ أنشئ حساباً بدلاً من ذلك",
      confirmTitle: "تحقق من بريدك الإلكتروني",
      confirmSubtitle: "تم إنشاء حسابك بنجاح!",
      confirmHint: "أرسلنا رابط تأكيد إلى",
      confirmNote: "يرجى النقر على الرابط في البريد الإلكتروني لتفعيل حسابك، ثم العودة لتسجيل الدخول.",
      errors: {
        invalidEmail: "يرجى إدخال عنوان بريد إلكتروني صالح.",
        shortPassword: "يجب أن تتكوّن كلمة المرور من 6 أحرف على الأقل.",
        noCode: "رمز التحقق مطلوب للمطالبة بهذه البطاقة.",
        invalidCode: "رمز التحقق غير صحيح.",
        emailInUse: "يوجد حساب بهذا البريد الإلكتروني بالفعل.",
        tagClaimed: "تمت المطالبة بهذه البطاقة من قِبَل شخص آخر.",
        emailNotConfirmed: "يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من بريدك الوارد.",
        generic: "البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مجدداً.",
      },
    },

    // ── AdminLoginPage ─────────────────────────────────────
    adminLogin: {
      title: "تسجيل دخول المسؤول",
      subtitle: "إدارة ملفك الشخصي الرقمي على Quickly",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "name@company.com",
      passwordLabel: "كلمة المرور",
      signIn: "تسجيل الدخول",
      forgotPassword: "نسيت كلمة المرور؟",
      forgotHint: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين.",
      sendResetEmail: "إرسال رابط إعادة التعيين",
      resetEmailSent: "✅ تحقق من بريدك الوارد! تم إرسال رابط إعادة تعيين كلمة المرور.",
      errors: {
        emptyFields: "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
        invalidCredential: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        emailNotConfirmed: "يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول. تحقق من بريدك الوارد.",
        tooManyRequests: "محاولات فاشلة كثيرة. حاول مجدداً لاحقاً.",
        generic: "فشل تسجيل الدخول. حاول مجدداً.",
        invalidEmail: "يرجى إدخال عنوان بريد إلكتروني صالح.",
        resetFailed: "فشل إرسال البريد الإلكتروني. حاول مجدداً.",
      },
    },

    // ── SetupPage ──────────────────────────────────────────
    setup: {
      title: "تعديل الملف الشخصي",
      profilePicLabel: "صورة الملف الشخصي",
      coverPhotoLabel: "صورة الغلاف",
      nameLabel: "الاسم *",
      titleFieldLabel: "المسمى الوظيفي",
      descriptionLabel: "الوصف",
      emailLabel: "البريد الإلكتروني (عام)",
      emailAddLabel: "أضف بريد إلكتروني",
      phoneLabel: "رقم الهاتف",
      phoneAddLabel: "أضف رقم هاتف",
      socialMediaTitle: "وسائل التواصل الاجتماعي",
      customLinksTitle: "روابط مخصصة",
      addBtn: "+ إضافة",
      platformPlaceholder: "المنصة",
      urlPlaceholder: "...//:https",
      linkLabelPlaceholder: "التسمية",
      linkUrlPlaceholder: "الرابط",
      successMsg: "تم تحديث الملف الشخصي بنجاح!",
      errors: {
        notLoggedIn: "يجب أن تكون مسجّلاً للدخول.",
        missingFields: "الاسم ورقم الهاتف مطلوبان.",
        imageTooLarge: "يجب أن لا يتجاوز حجم الصورة 1.5 ميغابايت.",
        saveFailed: "فشل الحفظ. حاول مجدداً.",
      },
    },

    // ── PublicPage ─────────────────────────────────────────
    public: {
      saveContact: "حفظ جهة الاتصال",
      shareProfile: "مشاركة الملف الشخصي",
      downloadQr: "تنزيل رمز QR",
      call: "اتصال",
      email: "بريد إلكتروني",
      adminEdit: "مسؤول؟ عدّل ملفك الشخصي.",
      errorMsg: "ملف Quickly الشخصي هذا غير نشط بعد. حاول مجدداً.",
      linkCopied: "تم نسخ الرابط إلى الحافظة!",
    },

    // ── LandingChoicePage ──────────────────────────────────
    landingChoice: {
      welcomePrefix: "مرحباً بك في",
      openProfile: "فتح الملف الشخصي",
      editProfile: "تعديل الملف الشخصي",
    },

    // ── AdminPanel ─────────────────────────────────────────
    adminPanel: {
      login: {
        title: "وصول المسؤول",
        subtitle: "أدخل رمز المسؤول السري للمتابعة",
        placeholder: "الرمز السري للمسؤول",
        enterBtn: "دخول اللوحة",
        checking: "جارٍ التحقق...",
        invalidSecret: "رمز المسؤول غير صالح.",
      },
      panel: {
        title: "لوحة المسؤول",
        tagsTotal: "بطاقة إجمالاً",
        createTitle: "إنشاء بطاقة جديدة",
        tagIdPlaceholder: "أدخل معرّف البطاقة",
        createBtn: "إنشاء",
        allTagsTitle: "جميع البطاقات",
        searchPlaceholder: "ابحث بمعرّف البطاقة أو رقم الهاتف...",
        loadingTags: "جارٍ تحميل البطاقات...",
        noTagsFound: "لا توجد بطاقات.",
        cols: {
          tagId: "معرّف البطاقة",
          status: "الحالة",
          phone: "الهاتف",
          owner: "المالك",
          setup: "الإعداد",
          actions: "الإجراءات",
        },
        deactivateBtn: "تعطيل",
        reactivateBtn: "إعادة تفعيل",
        confirmDeactivate: (id) => `تعطيل "${id}"? سيرى المستخدمون رسالة "تواصل مع الدعم".`,
        confirmDelete: (id) => `حذف "${id}"? سيتم إزالة البطاقة نهائياً.`,
        loadFailed: (msg) => `فشل تحميل البطاقات: ${msg}`,
        created: (id, code) => `✅ تم إنشاء البطاقة "${id}"! الرمز: ${code}`,
        deactivated: (id) => `تم تعطيل البطاقة "${id}".`,
        deleted: (id) => `تم حذف البطاقة "${id}".`,
        reactivated: (id) => `✅ تم إعادة تفعيل البطاقة "${id}".`,
        noTagId: "يرجى إدخال معرّف البطاقة.",
      },
      badges: {
        deactivated: "معطّلة",
        active: "نشطة",
        claimed: "مطالَب بها",
        unclaimed: "غير مطالَب بها",
      },
    },
  },
};