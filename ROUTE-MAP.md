# خريطة المسارات — من TopProz إلى will-rebuild-it-frontend

المرجع الرسمي لكل صفحة في المشروع القديم وحالة ترحيلها.
المصدر: `D:\Angular\topproz\topproz-frontend` (Angular 10، 25 موديول، 222 مكوّنًا).

**قاعدة:** لا يُضاف مسار إلى `src/app/app.routes.ts` إلا بعد بناء صفحته بالكامل —
حتى لا يشير البناء إلى صفحة غير موجودة. هذا الملف هو ما يتتبّع المتبقّي.

| الرمز | المعنى |
|---|---|
| ✅ | مُنجز بالكامل ومُتحقَّق منه (build + lint + test) |
| 🚧 | قيد التنفيذ |
| ⬜ | لم يبدأ |
| ⛔ | مستبعَد عن قصد (لا يقابله شيء في نطاق الإعمار) — السبب موثّق عند كل مجموعة |

---

## المرحلة 0 — التأسيس ✅

| البند | الحالة |
|---|---|
| هيكل المشروع + إعدادات Angular 20 / Tailwind 4 / SSR | ✅ |
| `core/` (api · dto · guards · i18n · interceptors · models · session · toast · mock) | ✅ |
| `layout/app-shell` + `header` + `sidebar` (تنقّل مجمّع لـ 7 أدوار) | ✅ |
| `layout/auth-shell` | ✅ |
| `shared/ui/data-table` — بديل Syncfusion Grid | ✅ |
| قاموسا `ar.json` / `en.json` + العربية RTL افتراضيًا | ✅ |
| `features/not-found` | ✅ |

---

## المرحلة 1 — المصادقة والتسجيل

الصفحة الأصلية `auth/new-login-page` كانت **6 شاشات** داخل مكوّن واحد يتحكم فيها
`slideMode` عبر query params. صارت كل شاشة مسارًا مستقلًا.

| # | الأصل | الجديد | الحالة |
|---|---|---|---|
| 1 | `new-login-page` (`slideMode='loginPage'`) | `/auth/sign-in` | ✅ |
| 2 | `new-login-page` (`FrgtPswdEmailPage`) | `/auth/forgot-password` | ✅ |
| 3 | `new-login-page` (`FrgtPswdModeSelection`) | `/auth/forgot-password/method` | ✅ |
| 4 | `new-login-page` (`FrgtPswdOTPPage`) | `/auth/forgot-password/verify` | ✅ |
| 5 | `new-login-page` (`PswConfirmationPage`) | `/auth/forgot-password/reset` | ✅ |
| 6 | `new-login-page` (`validateCustPswUpdate`) | `/auth/activate/*` | ✅ |
| 7 | `auth/sign-up` | `/auth/register` | ✅ |
| 8 | `auth/forgot-password` (القديم غير المستخدم) | مدموج في 2–5 | ✅ |
| 9 | `registrations/proregistration` | `/auth/contractor-register/*` (خطوات ١–٤) | ✅ |
| 10 | `registrations/proregistration2/...` (مسار VANLYNK) | مستبعَد — قمع تسويقي أمريكي | ⛔ |
| 11 | `registrations/proregistrationlead/...` (`lead-registration2`) | `/auth/contractor-register/*` (خطوتا ٥–٦) | ✅ |
| 12 | `registrations/leadgeneration` | مستبعَد — شراء عملاء محتملين | ⛔ |
| 13 | `registrations/map/:loginId` (`map1`) | مدموج في خطوة الموقع — «مناطق العمل» | ✅ |
| 14 | `registrations/topprozConfirmation/...` | `/auth/registered` | ✅ |
| 15 | `registrations/pro-registration3` | مستبعَد — تابع للمسار 10 | ⛔ |

> **بنية تدفّق الاستعادة/التفعيل:** المساران `/auth/forgot-password` و`/auth/activate`
> يشتركان في نفس الخطوات الأربع ولا يختلفان إلا في `data.intent` والخطوة الأخيرة.
> الحالة محفوظة في `PasswordResetFlow` المُوفَّر على مستوى **المسار** (لا المكوّن)،
> لأن الـ guards تعمل قبل إنشاء أي مكوّن. رمز التحقق التجريبي: `123456`.

> **لماذا `lead-registration2` أولًا؟** صفحة الدخول الحيّة (`new-login-page`) توجّه
> إلى `proregistrationlead` **مرّتين ولا توجّه إلى `proregistration2` إطلاقًا**.
> مجموع نقاط الاستدعاء: ٨ لـ `lead-registration2` مقابل ٣ لـ `pro-registration2`.

> **`lead-generation` ليس نسخة ثالثة من تسجيل المقاول.** يُستدعى من `leadgen-home`
> و`pro-public-profile` — أي أنه **طلب خدمة يقدّمه المستفيد**، كيان مختلف ينتمي
> إلى المرحلة ٤ (طلبات الإعمار) لا إلى المرحلة ١.

> **تدفّق المقاول الكامل الآن:** `/auth/register` ← `/auth/registered` ←
> `/auth/contractor-register` (٦ خطوات) ← لوحة المقاول. الحساب يبقى «معلّقًا»
> ويرفضه تسجيل الدخول حتى تكتمل الخطوة السادسة.

### ⚠️ حجم المتبقّي من المرحلة 1

معالِج التسجيل في المشروع القديم ضخم — **≈23,000 سطر** موزّعة كالتالي
(TS + HTML، بدون spec):

| المكوّن | الأسطر |
|---|---:|
| `pro-registration2` | 5,135 |
| `lead-generation` | 5,000 |
| `lead-registration2` | 4,738 |
| `pro-registration` | 3,864 |
| `map1` | 2,135 |
| ~~`map`~~ | ~~1,760~~ ❌ كود ميت |
| `pro-registration3` | 324 |
| `topproz-confirmation` | 138 |
| **الإجمالي** | **≈23,094** |

**اكتشاف:** `registrations/map/` (1,760 سطرًا) **كود ميت** — غير مُصرَّح به في
`registrations.module.ts` وغير مستورد في أي مكان. النسخة الحيّة هي `map1` فقط.
لا يُرحَّل.

للمقارنة: كل ما رُحِّل حتى الآن (٨ صفحات) كان مصدره ≈1,400 سطر. أي أن بقية
المرحلة 1 وحدها أكبر بـ 16 مرة مما أُنجز، وتحتاج **جلسة مخصّصة لكل معالِج**.

`topproz-confirmation` (14) صغيرة لكن زرّها الوحيد «متابعة» يفتح المعالِج،
فبناؤها قبله يعني صفحة إجراؤها الأساسي معطّل — لذلك أُجّلت معه لا قبله.

---

## المرحلة 2 — الواجهة العامة

| الأصل | الجديد | الحالة |
|---|---|---|
| `welcome/` (`WelcomeComponent`) | `/` (هبوط عام SSR) | ✅ |
| `welcome/leadgen` | مستبعَد — صفحة تسويق للمنتج الأمريكي | ⛔ |
| `welcome/vanlynk` | مستبعَد — صفحة تسويق للمنتج الأمريكي | ⛔ |
| `welcome/Pricing` | مستبعَد — تسعير اشتراكات السوق الأمريكي | ⛔ |

---

## المرحلة 3 — لوحات التحكم

> ⚠️ **اللوحات الثلاث في الأصل كانت فارغة عمليًا** — لا تعرض سوى
> «Hi {name} Welcome to X!». بطاقات الإحصاءات الأربع موجودة في الترميز لكنها
> **معلّقة داخل تعليقات HTML**، وكذلك رابط «View More». نقلت التحية كما هي،
> وأحييت تلك البطاقات على بيانات إعمار حقيقية: نسخ حرفي كان سينتج ثلاث صفحات
> بيضاء لا تفيد مشغّلًا. لوحة المقاول كانت تحوي أيضًا نافذة jQuery لتفعيل
> VANLYNK — تخصّ منتج الاشتراكات لا اللوحة، وأُجّلت مع قرار VANLYNK.

| الأصل | الجديد | الحالة |
|---|---|---|
| `topproz/dashboard` | `/app/admin-dashboard` | ✅ |
| `pro/dashboard` | `/app/contractor-dashboard` | ✅ |
| `staff/dashboard` | `/app/staff-dashboard` | ✅ |
| — (جديد للمورّدين) | `/app/supplier-dashboard` (منزل دور المورّد — بطاقات + أحدث أوامر الشراء) | ✅ |
| `direct-booking-lead/dashboard` | مدموج — `/app/admin-dashboard` + فلتر «المصدر» في `/app/work-requests` | ✅ |
| `pro/dispatchboard` (`AlpCpDispatchboard`) | `/app/dispatch` (لوحة كانبان حسب الحالة) | ✅ |
| `pro/alp-dispatchboard` (`AlpNewDispatchboard`) | مدموج في `/app/dispatch` | ✅ |
| `topproz/myprofile/:id` | `/app/profile` (هوية من الجلسة + تغيير كلمة المرور) | ✅ |

> **قرار: بوّابة واحدة لكل الأدوار السبعة.** كان تسجيل الدخول (وكذلك إعادة تعيين
> كلمة المرور وتفعيل الحساب) يقذف المستفيد والمتبرّع إلى أصل خارجي
> (`customerPortalUrl`). ذلك القرار سابق لبناء تجربتهما داخل التطبيق، وصار يناقض
> `homeRouteForRole` و`roleGuard` والشريط الجانبي واختبارات الحارس — وكلّها توجّههما
> إلى الداخل. النتيجة كانت: مستفيد مسجّل دخوله مسبقًا يعمل بشكل سليم، لكنه إن سجّل
> دخوله من جديد يُقذف خارجًا ولا يرى شيئًا ممّا بُني له. وُحِّدت المسارات الثلاثة على
> `homeRouteForRole`، وحُذف مفتاح الإعداد الميت.

### قائمة المستخدم في الترويسة (متاحة لكل الأدوار)

> كانت الروابط الثلاثة في قائمة الترويسة تشير إلى مسارات غير موجودة — أي أن كل دور
> كان يصطدم بصفحة «غير موجودة» عند فتحها. طبقة البيانات (`ProfileApi` /
> `ComplaintsApi` / `MasterApi`) ومفاتيح الترجمة كانت جاهزة مسبقًا.

| الأصل | الجديد | الحالة |
|---|---|---|
| `topproz/myprofile` | `/app/profile` | ✅ |
| `pro/report-a-pro` (جانب المستخدم) | `/app/complaints` (سجل شكاواي) | ✅ |
| `pro/report-a-pro` (النموذج) | `/app/complaints/new` (فريق + أسباب + وصف) | ✅ |
| `topproz/privacy` | `/app/privacy` (من الإعدادات العامة) | ✅ |

---

## المرحلة 4 — طلبات الإعمار

> **قرار:** `lead-list` القديمة كانت موزّعًا حسب الدور (ADMIN→`admin-list`،
> PRO→`pro-list`). دمجتُ الاثنين في `/app/work-requests` واحدة: القائمة نفسها،
> والإجراءات (إسناد فريق، رفض) محصورة بالمدير عبر `canDecide`. حذفتُ حقول سوق
> الـ«leads» — سعر الشراء، تاريخ الشراء، موعد الحجز — فطلب الإعمار يُسنَد لا يُشترى.
> أضفت ٦ طلبات تجريبية تغطي كل الحالات والمحافظات ودرجات الضرر لتفعيل الفلاتر.
>
> **الحجز المباشر:** بدل تكرار قائمة رابعة، أضفت حقل `origin` للطلب
> (`beneficiaryPortal` | `directBooking`) وفلتر «المصدر» في نفس القائمة. و`addNewJob`
> — كان قمعًا من ٤ نماذج بتمرير jQuery لعميل قد لا يكون موجودًا — صار نموذجًا مسطّحًا
> واحدًا يملؤه المشغّل والمستفيد على الهاتف، ينشئ طلبًا بـ `origin=directBooking`.

| الأصل | الجديد | الحالة |
|---|---|---|
| `lead/leadlist` (فرع ADMIN: `admin-list`) | `/app/work-requests` | ✅ |
| `lead/proLeadDetails` + `adminLeadDetails` | `/app/work-requests/:id` (موحّد، إجراءات حسب الدور) | ✅ |
| `lead/leadlist` (فرع PRO: `pro-list`) | `/app/work-requests` (نفس القائمة، قراءة فقط) | ✅ |
| `direct-booking-lead/direct-booking-leadlist` | مدموج في `/app/work-requests` (فلتر «المصدر») | ✅ |
| `direct-booking-lead/leaddetails` | مدموج في `/app/work-requests/:id` | ✅ |
| `direct-booking-lead/addNewJob` | `/app/work-requests/new` (نموذج تسجيل للمشغّل) | ✅ |

---

## المرحلة 5 — المستفيدون والمقاولون والموردون

> **المقاولون = الفرق:** أعدت استخدام نموذج `Team` الغني الموجود (تخصصات، رخص،
> تغطية، تقييمات، أعمال سابقة) وواجهته الجاهزة (`TeamsApi`: قائمة/ملف/تقييمات).
> بطاقات لا جدول — المشغّل يمسح القدرة والمكانة بصريًا. جسر `contractor-spec`
> يطبّع سلاسل التخصص (Title-Case) إلى مفاتيح `teams.specialization` الموجودة.

| الأصل | الجديد | الحالة |
|---|---|---|
| `customer/customerlist` (+ `CustomerNewList`) | `/app/beneficiaries` (سجلّ الأسر) | ✅ |
| `customer/customerDetails` (+ `CustomerDetailsNew`) | `/app/beneficiaries/:id` (ملف + طلبات + توثيق) | ✅ |
| `pro/prolist` | `/app/contractors` (بطاقات) | ✅ |
| `pro/promyprofile/:id/:loginId` | `/app/contractors/:id` (ملف + تقييمات) | ✅ |
| `pro/promyprofile/map/:loginId` | مدموج في `/app/contractors/:id` (خريطة نطاق التغطية) | ✅ |
| `pro/propublic/:id` | `/pub/contractor/:id` (عام، يُصيَّر على الخادم) | ✅ |
| `pro/report-pro-list` | `/app/complaints` (سجل الشكاوى) | ✅ |
| `pro/report-a-pro-view/:reportNumber` | `/app/complaints/:id` (+ ردّ المشغّل يُغلق الشكوى) | ✅ |

> **الشكاوى جانبان لكيان واحد.** «الإبلاغ عن فريق» و«قائمة البلاغات» في البرنامج
> القديم كانتا شاشتين منفصلتين لنفس السجلّ؛ هنا `/app/complaints` واحدة: المستفيد
> يرى ما قدّمه، والمشغّل يرى الكل ويملك مربّع الردّ (`POST /complaints/:id/respond`)
> — وإرسال الردّ يُغلق الشكوى.
>
> **الملف العام:** لا يعرض نصوص التقييمات، بل متوسّطها وعددها فقط. التقييمات تحمل
> أسماء مستفيدين أعاد هذا الفريق بناء منازلهم، ولم يوافقوا على نشر هذا الارتباط على
> صفحة مفتوحة. تظهر كاملة للمسجّلين في `/app/teams/:id`.
>
> **خريطة التغطية:** دبّوس عند مركز كل محافظة — فالتغطية مسجّلة على مستوى المحافظة
> لا كعنوان دقيق.
| `vendor/vendorlist` | `/app/suppliers` | ✅ |
| `vendor/vendorprofile` | `/app/suppliers/:id` (ملف + اعتماد/إيقاف) | ✅ |

---

## المرحلة 6 — دورة العمل

> **الفاتورة → المستخلص:** الأصل كان `invoice` (فاتورة يصدرها المقاول للعميل).
> في الإعمار الاتجاه معكوس: المقاول يقدّم **مستخلصًا** (مطالبة دفع مرحلية)
> والمنصة تراجع وتصرف. أضفت **محتجزات الضمان** (retention) — نسبة تُحتجز كضمان
> عيوب، معيارية في المقاولات ولم تكن في الأصل. الصرف يدعم الدفع الجزئي
> (`partiallyPaid`) وكل الانتقالات محروسة على الخادم.

> **قرار جوهري:** `estimate-details` القديمة كانت **≈16,000 سطر** — لأنها *بانٍ*
> كامل لجدول الكميات (إضافة/حذف/تسعير البنود، حساب حيّ، تصدير PDF). مهمة المكتب
> الخلفي أضيق: **قراءة الجدول المُقدَّم واتخاذ قرار**. فبنيتُ صفحة مراجعة —
> جدول كميات مجمّع حسب الفئة، إجماليات، اعتماد بتوقيع (`signature-pad`) أو رفض
> بسبب. بناء التقدير مهمة الفريق في مساحته، خارج نطاق هذه الصفحة.
>
> وأصلحت ثغرة: الـ handler كان يلتقط التوقيع ثم **يهمله**؛ الآن يُحفظ
> (`approvalSignatureUrl`) كسجلّ موافقة — وهو الغرض من التقاطه.

| الأصل | الجديد | الحالة |
|---|---|---|
| `estimate/estimateList` | `/app/estimates` | ✅ |
| `estimate/estimateDetails` | `/app/estimates/:id` (مراجعة، لا بناء) | ✅ |
| `estimate/viewEstimate` | مدموج في `/app/estimates/:id` | ✅ |
| `workorder/workorderlist` | `/app/work-orders` | ✅ |
| `workorder/workorderDetails` | `/app/work-orders/:id` (حالة + انتقالات) | ✅ |
| `workorder/preworkinspection` | `/app/work-orders/:id/inspection/preWork` | ✅ |
| `workorder/postworkinspection` | `/app/work-orders/:id/inspection/postWork` (نفس المكوّن) | ✅ |
| (قائمة معاينات مجمّعة) | `/app/inspections` (حالة معاينتَي كل أمر عمل) | ✅ |
| `invoice/invoice-list` | `/app/statements` (مستخلصات) | ✅ |
| `invoice/invoice-details` | `/app/statements/:id` (مراجعة/اعتماد/صرف) | ✅ |
| `pricebook/pricebooklist` | `/app/pricebook` | ✅ |
| `pricebook/pricebookdetails` | مدموج في نافذة إضافة/تعديل | ✅ |

---

## المرحلة 7 — المخزون والمعدّات

### المخزون
| الأصل | الجديد | الحالة |
|---|---|---|
| `inventory/inventorylist` (+ GridView + NewList) | `/app/inventory` | ✅ |
| `inventory/inventorydetails` (+ NewDetails) | `/app/inventory/:id` (الرصيد وحدّ إعادة الطلب) | ✅ |
| `inventory/locationlist` (+ NewList) | `/app/warehouses` | ✅ |
| `inventory/locationdetails` (+ NewDetails) | `/app/warehouses/:id` (المستودع ومخزونه) | ✅ |
| `inventory/purchaseOrderList` | `/app/purchase-orders` | ✅ |
| `inventory/purchaseOrderDetails` | `/app/purchase-orders/:id` (بنود + انتقالات + استلام للمخزون) | ✅ |
| `inventory/createPo` | `/app/purchase-orders/new` (بنود ديناميكية + إجمالي محسوب) | ✅ |
| `inventory/truckOrderList` | `/app/shipments` (تتبّع عبر المعابر + ملخّص) | ✅ |
| `inventory/truckOrderDetails` | مدموج في قائمة الشحنات (بطاقات الحالة والحمولة) | ✅ |
| `inventory/approveInventory` | `/app/purchase-orders` بفلتر «بانتظار الاعتماد» + إجراء الاعتماد في التفاصيل | ✅ |

> **إضافة على الـ mock:** أُضيفت `GET /warehouses/:id` (المستودع + مخزونه + ملخّصه)
> و`GET /stock/:id` و`POST /purchase-orders`. أمر الشراء يُنشأ **مسودة** دائمًا،
> ويحسب الخادم مبلغ كل بند والإجمالي بدل الوثوق بما يرسله النموذج؛ والاعتماد
> والاستلام يبقيان في مسار الانتقالات القائم — فالاستلام هو ما يُدخل المواد
> للمخزون. لذلك «اعتماد المخزون» لم يكن يحتاج صفحة جديدة: فلتر الحالة في القائمة
> مع زر الاعتماد في التفاصيل يؤدّيان الدور نفسه.

### المعدّات
| الأصل | الجديد | الحالة |
|---|---|---|
| `equipment/alp-equipment` (+ `equipmentlist`) | `/app/equipment` | ✅ |
| `equipment/add-equipment` | `/app/equipment/new` (نفس مكوّن النموذج) | ✅ |
| `equipment/edit-equipment` | `/app/equipment/:id/edit` (نفس مكوّن النموذج) | ✅ |
| `equipment/equipment-details` | `/app/equipment/:id` (حجز + أعطال) | ✅ |
| `equipment/equipmentdetails` (القديم) | مدموج في `/app/equipment/:id` | ✅ |
| `equipment/equipment-book` | مدموج في `/app/equipment/:id` | ✅ |
| `equipment/equipment-history` | مدموج في `/app/equipment/:id` (الحجوزات والأعطال) | ✅ |
| `equipment/equipment-problems` | مدموج في `/app/equipment/:id` | ✅ |
| `equipment/equipment-reports` | `/app/equipment/reports` (محسوبة من سجلّ الأسطول) | ✅ |

> **إضافة على الـ mock:** لم يكن للمعدّات نقطتا إنشاء/تعديل، فأُضيفت
> `POST /equipment` و`PUT /equipment/:id` مع التحقّق من تفرّد الرمز (409)، ولا
> تمسّان الحجوزات ولا الأعطال — لكلٍّ منهما نقطته الخاصة. أما تقارير الأسطول
> فمشتقّة بالكامل من قائمة المعدّات (الحالة والصنف والحجوزات والأعطال كلّها على
> السجلّ)، فلم تلزمها نقطة تقارير.
| `equipment/equipment-schedule` (Syncfusion Schedule) | `/app/equipment/schedule` (Gantt للقراءة) | ✅ |
| `equipment/equipment-schedule2` | مدموج في `/app/equipment/schedule` | ✅ |

> ⚠️ `equipment/schedule` هي أثقل شاشة في المشروع (Syncfusion Schedule).
> تحتاج إعادة بناء بـ CDK drag-drop + شبكة زمنية مخصّصة — خصّص لها جلسة كاملة.

---

## المرحلة 8 — المال والاشتراكات

| الأصل | الجديد | الحالة |
|---|---|---|
| `payments/payment-list` | `/app/disbursements` (سجلّ الصرف) | ✅ |
| `payments/payment-details` | `/app/disbursements/:id` (دورة حياة التحويل) | ✅ |
| `priceList/` (`ServicesPriceList`) | `/app/price-lists` (أسعار مرجعية حسب التخصّص) | ✅ |
| `priceList/editPlanInfo/:planId` | مدموج — عرض للقراءة (لا تحرير) | ✅ |
| `priceList/subCatPriceList/:catCode` | مدموج — فلتر التخصّص في نفس القائمة | ✅ |
| `priceList/editSubCatPriceList/:catId` | مدموج — عرض للقراءة | ✅ |
| `pro/cards` (+ `ProCardsNew`) | مستبعَد — انظر الملاحظة | ⛔ |
| `pro/cards/:userId/:stripeCustomerId/view` | مستبعَد | ⛔ |
| `pro/cards/create` | مستبعَد | ⛔ |
| `pro/cards/:userId/:stripeCustomerId/edit` | مستبعَد | ⛔ |
| `pro/createcard` | مستبعَد | ⛔ |

> ⛔ **استبعاد مقصود — بطاقات الدفع (Stripe).** لا يوجد في نطاق الإعمار ما يقابلها:
> الأموال تصل من المموّلين وتُصرف للمقاولين عبر **الحوالات البنكية والمستخلصات**
> (`/app/disbursements` و`/app/statements`)، ورسوم العضوية تُسجَّل في
> `/app/subscriptions`. لا حاجة لتخزين بيانات بطاقات في المنصّة أصلًا.
| `sub/enableVanlynk` | `/app/subscriptions` (سجل العضويات) | ✅ |
| `sub/subscriptionHistory` (+ `/pro/:loginId`) | `/app/subscriptions/:id` (سجل المدفوعات) | ✅ |
| `sub/vanlynkPaymentSubscriptionHistory` | `/app/subscriptions/:id` | ✅ |
| `sub/vanlynkPaymentHistory` | `/app/subscriptions/:id` | ✅ |
| `sub/vanlynkSubscriptionHistory` | `/app/subscriptions/:id` | ✅ |
| `sub/vanlynkSubscriptionDetails` (+ `/pro/:loginId`) | `/app/subscriptions/:id` | ✅ |
| `sub/leadgenPaymentHistory` (+ `/pro/:loginId`) | `/app/subscriptions/:id` | ✅ |
| `sub/leadgenRefundRequests` (+ `/pro/:loginId`) | `/app/subscriptions/:id` (زر الاسترداد) | ✅ |
| `sub/leadgenAccountHistory` (+ `/pro/:loginId`) | `/app/subscriptions/:id` | ✅ |
| `sub/leadgenSubscriptionDetails` (+ `/pro/:loginId`) | `/app/subscriptions/:id` | ✅ |

> ✅ **حُلّ:** أُعيدت صياغة الاشتراكات إلى **عضوية المقاول** في المنصّة (رسم تحقّق
> سنوي للأهلية للمناقصات) بدلًا من منطق شراء العملاء المحتملين الأمريكي. المسارات
> الـ16 المكرّرة (Vanlynk مقابل Leadgen × الاشتراك/الدفع/الاسترداد) انطوت في مفهوم
> واحد: `/app/subscriptions` (سجل العضويات مع مؤشّرات الإيراد) و`/app/subscriptions/:id`
> (سجل المدفوعات + التجديد/الإلغاء/الاسترداد). حارس المسار: `admin` فقط.

---

## المرحلة 9 — الإعدادات والصلاحيات

### إعدادات الحساب (`account_setting/`)
| الأصل | الجديد | الحالة |
|---|---|---|
| `accountSettings/:tab` و `:tab/:ctab` | `/app/account-settings` (تبويبان داخل الصفحة) | ✅ |
| `groupprofile` | `/app/profile` + `/app/contractors/:id` للمنشأة | ✅ |
| `staffroledetails` | `/app/permissions` (مصفوفة الأدوار) | ✅ |
| `permissions` | `/app/permissions` (مصفوفة قراءة) | ✅ |
| `pricebookpackagedetails` | `/app/pricebook` | ✅ |
| `pricebookservicesubcategory` | `/app/global-settings/reference` (التخصّصات) | ✅ |
| `inventorysubcategory` | `/app/global-settings/reference` (أصناف المواد) | ✅ |
| `equipmentsubcategorydetails` | `/app/global-settings/reference` (أصناف المعدّات) | ✅ |
| `equipmentstatus` | `/app/global-settings/reference` (حالات المعدّات) | ✅ |
| `equipmentagreementdetails` | `/app/global-settings/terms` (مستند لكل فئة) | ✅ |
| `loginagreementdetails` | `/app/global-settings/terms` (شروط الاستخدام) | ✅ |
| `marketingmediadetails` | `/app/global-settings/reference` (قنوات التواصل) | ✅ |
| `vendorcategorydetails` | `/app/global-settings/reference` (أصناف المواد) | ✅ |

> **`accountSettings` كان حاوية تبويبات فوق محرّرات بحث.** تلك القوائم أنواع ثابتة
> هنا (انظر `/app/global-settings/reference`)، والاتفاقيات مستندات في
> `/app/global-settings/terms`، والأدوار في `/app/permissions`. فما تبقّى فعليًا هو
> ما كانت التبويبات موجودة لأجله: **كيف تُستخدم بيانات المستخدم، وأي إشعارات
> يتلقّاها** — وهو ما بُنيت الصفحة عليه (تبويبا «البيانات والمشاركة» و«الإشعارات»
> + منطقة إيقاف الحساب). وقد فعّلت أخيرًا نقطتَي
> `getNotificationPreferences`/`updateNotificationPreferences` اللتين لم تكن أي
> صفحة تستدعيهما. المسار بلا حارس دور — فلكل دور حساب يديره.

### الإعدادات العامة (`global-settings/`)
| الأصل | الجديد | الحالة |
|---|---|---|
| `unitOfMeasurements` + `editUnitOfMeasurements` | `/app/global-settings/reference` (قسم الوحدات) | ✅ |
| `geofencingSetting` | `/app/global-settings/geofencing` (خريطة + محافظات/أحياء) | ✅ |
| `timeCardActivites` + `editTimeCardActivites` | `/app/global-settings/reference` (قسم أنشطة الدوام) | ✅ |
| `paymentMethods` + `editPaymentMethods` | `/app/global-settings/reference` (قسم طرق الصرف) | ✅ |
| `termsAndConditions` + `editTermsAndConditions` | `/app/global-settings/terms` (نافذة تحرير) | ✅ |
| `vendorCategories` + `editVendorCategory` | `/app/global-settings/reference` (قسم أصناف المواد) | ✅ |
| `salesAndMarketing` + `editSalesAndMarketing` | `/app/global-settings/reference` (قسم قنوات التواصل) | ✅ |

> **لماذا «بيانات مرجعية» بدل ستّة محرّرات؟** في البرنامج القديم كانت هذه جداول
> بحث قابلة للتحرير في قاعدة البيانات. هنا كلٌّ منها **نوع اتحادي ثابت** في
> `domain.constants.ts` تُشتقّ منه أنواع التطبيق وسياقات `status-pill` ومفاتيح
> الترجمة. تحريرها وقت التشغيل لا يمكن أن يغيّر تلك الأنواع، فمحرِّرها سيكون
> صوريًّا. لذلك جُمعت في صفحة واحدة تعرض القيم الحيّة للاطّلاع — وهو ما يحتاجه
> المشغّل فعليًا — مع توثيق السبب داخل الصفحة نفسها.
> أما `geofencingSetting` فبيانات حقيقية (`GeoArea` عبر `MasterApi`)، فبُنيت صفحة
> كاملة لها بالخريطة. ونطاق التغطية يُسجَّل بالمحافظة/الحي لا بنطاق دائري حول
> عنوان — حفاظًا على خصوصية مواقع المستفيدين.

---

## المرحلة 10 — المتبقّي

| الأصل | الجديد | الحالة |
|---|---|---|
| `staff/stafflist` (+ `NewStaffList`) | `/app/staff` | ✅ |
| `staff/staffprofile` (+ `StaffProfile`) | `/app/staff/:id` (+ سجلّ الدوام) | ✅ |
| `staff/timecard` | مدموج في ملف الموظف | ✅ |
| `staff/staff-timecard` | مدموج في ملف الموظف | ✅ |
| `questions/standard-questions-list` | `/app/questions` (عارض بنك الأسئلة) | ✅ |
| `questions/categories-list` | مستبعَد — انظر الملاحظة | ⛔ |
| `questions/subcategories-list` | مستبعَد — انظر الملاحظة | ⛔ |
| `questions/category-question-form` | مستبعَد — انظر الملاحظة | ⛔ |

> ⛔ **شجرة تصنيف الأسئلة لا يقابلها شيء هنا.** في البرنامج القديم كان بنك الأسئلة
> جدولًا مصنَّفًا (فئة ← فئة فرعية ← سؤال) قابلًا للتحرير. في هذا البناء استمارة
> تقييم الأضرار **تدفّق متفرّع مُنسَّق** (`nextQuestionId`) بنصوص عربية/إنجليزية
> مُراجَعة، لا شجرة فئات: فالسؤال التالي تحدّده الإجابة لا التصنيف. محرّر فئات فوق
> هذا البناء سيكسر سلامة التفرّع ومراجعة النصّين معًا، لذلك يبقى `/app/questions`
> عارضًا للقراءة يُظهر النصّ ونوع الإدخال والخيارات ووجهة كل خيار.
| `promotions/promotionlist` | `/app/campaigns` | ✅ |
| `promotions/promotiondetails` | `/app/campaigns/:id` (إرسال/إلغاء) | ✅ |
| `promotions/emailList` | مدموج في `/app/campaigns/:id` (الجمهور والوصول) | ✅ |
| `promotions/budget` | مدموج في `/app/campaigns/:id` (الميزانية والمنصرف) | ✅ |
| `notifications/notificationsList` | `/app/notifications` | ✅ |
| `notifications/push-notifications` | `/app/notifications/push` (إرسال إعلان) | ✅ |

> **الحملات:** «قائمة المستلمين» و«الميزانية» لم تكونا تستحقّان صفحتين مستقلّتين —
> كلتاهما بلا معنى بعيدًا عن حملتها. الجمهور وحجمه ونسبة التسليم كانت معروضة أصلًا
> في تفاصيل الحملة، وأُضيف إليها شريط **الميزانية والمنصرف** (مع حقلي `budget`
> و`spent` على النموذج) لأن تمويل التوعية يأتي من مال المتبرّعين نفسه.
>
> **الإعلانات:** أُضيفت `POST /notifications`. الشاشة القديمة كانت تربط مزوّد
> إشعارات جوال؛ هنا يصل الإعلان إلى مركز الإشعارات داخل التطبيق — وهي قناة التسليم
> التي يملكها هذا البناء فعلًا. أما مخاطبة من هم **خارج** التطبيق (بريد/رسائل) فهي
> حملة لا إشعار.
| `social/yelp` | `/app/external-ratings` (تقارير مراقبة مستقلّة) | ✅ |
| `social/google` | مدموج — تقارير المراقبة | ✅ |
| `support/customer-tickets` | `/app/support` | ✅ |
| `support/ticket/:ticketId` | `/app/support/:id` (محادثة + رد) | ✅ |
| `scorecard/scorecardHome` | `/app/scorecards` (ترتيب أداء محسوب) | ✅ |
| `scorecard/scorecardGeneration` | `/app/scorecards/:id` (تفصيل محسوب) | ✅ |
| `logs/twilliosms` | `/app/logs` (سجلّ تسليم موحّد) | ✅ |
| `logs/twilliosendgridMail` | مدموج — سجلّ التسليم | ✅ |
| `not-found` | `**` | ✅ |

---

## المرحلة 11 — تجارب أدوار الواجهة العامة (مطابقة customer-web)

> **لماذا:** كان `homeRouteForRole` يوجّه المستفيد إلى `/app/dashboard`، والمتبرّع
> إلى `/app/donations`، والفريق إلى `/app/team-dashboard` — وكانت الثلاثة **غير
> موجودة**، فيسقط كل تسجيل دخول لهذه الأدوار على `**` (صفحة غير موجودة). كما كانت كل
> روابط الشريط الجانبي للمستفيد (٧ روابط) معطّلة. طبقة البيانات (API + handlers)
> كانت جاهزة مسبقًا؛ الناقص كان صفحات العرض فقط. مفاتيح i18n كانت مُرحَّلة مسبقًا من
> التطبيق المرجعي (`.list`/`.view`/`.profile`)، فبُنيت المكوّنات على نفس المفاتيح.

| الدور | الجديد | المصدر (API) | الحالة |
|---|---|---|---|
| مستفيد | `/app/dashboard` (لوحة مركّبة) | projects + requests + funding | ✅ |
| مستفيد | `/app/requests` (+ `/:id`) | `RequestsApi` | ✅ |
| مستفيد | `/app/projects` (+ `/:id` بـ phase-stepper) | `ProjectsApi` | ✅ |
| مستفيد | `/app/teams` (شبكة بطاقات) (+ `/:id` بمتابعة/تقييمات) | `TeamsApi` | ✅ |
| مستفيد | `/app/funding` | `FundingApi` | ✅ |
| مستفيد | `/app/reviews` | `ReviewsApi` | ✅ |
| متبرّع | `/app/donations` (منزل الدور) | `DonationsApi` | ✅ |
| فريق | `/app/team-dashboard` (منزل الدور) | `TeamWorkspaceApi` | ✅ |

---

## حسابات تجريبية (mock)

كلمة المرور لجميعها: `Demo@1234`

| البريد | الدور | الحالة | الغرض |
|---|---|---|---|
| `admin@example.com` | مدير المنصة | نشط | المسار الافتراضي |
| `contractor@example.com` | مقاول **و** مستفيد | نشط | اختبار اختيار الدور (حسابان لبريد واحد) |
| `staff@example.com` | كادر ميداني | نشط | |
| `supplier@example.com` | مورّد مواد | نشط | |
| `pending@example.com` | مقاول | تسجيل غير مكتمل | اختبار حجب الدخول |
| `suspended@example.com` | مقاول | موقوف | اختبار حجب الدخول |
| `youssef@example.com` | مستفيد | نشط | يُحوَّل لتطبيق العملاء |
| `amina@example.com` | متبرّع | نشط | يُحوَّل لتطبيق العملاء |
