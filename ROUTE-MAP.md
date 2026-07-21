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
| 10 | `registrations/proregistration2/...` (مسار VANLYNK) | مؤجّل — انظر أدناه | ⬜ |
| 11 | `registrations/proregistrationlead/...` (`lead-registration2`) | `/auth/contractor-register/*` (خطوتا ٥–٦) | ✅ |
| 12 | `registrations/leadgeneration` | ليس تسجيلًا — انظر أدناه (المرحلة ٤) | ⬜ |
| 13 | `registrations/map/:loginId` (`map1`) | مدموج في خطوة الموقع — «مناطق العمل» | ✅ |
| 14 | `registrations/topprozConfirmation/...` | `/auth/registered` | ✅ |
| 15 | `registrations/pro-registration3` | مدموج في 10 | ⬜ |

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
| `welcome/` (`WelcomeComponent`) | `/` | ⬜ |
| `welcome/leadgen` | `/contractors` | ⬜ |
| `welcome/vanlynk` | `/platform` | ⬜ |
| `welcome/Pricing` | `/pricing` | ⬜ |

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
| — (جديد للمورّدين) | `/app/supplier-dashboard` | ⬜ |
| `direct-booking-lead/dashboard` | `/app/requests-dashboard` | ⬜ |
| `pro/dispatchboard` (`AlpCpDispatchboard`) | `/app/dispatch` | ⬜ |
| `pro/alp-dispatchboard` (`AlpNewDispatchboard`) | `/app/dispatch` (النسخة الحديثة) | ⬜ |
| `topproz/myprofile/:id` | `/app/account/profile` | ⬜ |

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
| `pro/promyprofile/map/:loginId` | `/app/contractors/:id/service-area` | ⬜ |
| `pro/propublic/:id` | `/pub/contractor/:id` | ⬜ |
| `pro/report-pro-list` | `/app/contractors/reports` | ⬜ |
| `pro/report-a-pro-view/:reportNumber` | `/app/contractors/reports/:reportNumber` | ⬜ |
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
| `inventory/inventorydetails` (+ NewDetails) | `/app/inventory/:id` | ⬜ |
| `inventory/locationlist` (+ NewList) | `/app/warehouses` | ✅ |
| `inventory/locationdetails` (+ NewDetails) | `/app/warehouses/:id` | ⬜ |
| `inventory/purchaseOrderList` | `/app/purchase-orders` | ✅ |
| `inventory/purchaseOrderDetails` | `/app/purchase-orders/:id` (بنود + انتقالات + استلام للمخزون) | ✅ |
| `inventory/createPo` | `/app/purchase-orders/new` | ⬜ |
| `inventory/truckOrderList` | `/app/shipments` | ⬜ |
| `inventory/truckOrderDetails` | `/app/shipments/:id` | ⬜ |
| `inventory/approveInventory` | `/app/inventory/approvals` | ⬜ |

### المعدّات
| الأصل | الجديد | الحالة |
|---|---|---|
| `equipment/alp-equipment` (+ `equipmentlist`) | `/app/equipment` | ✅ |
| `equipment/add-equipment` | `/app/equipment/new` | ⬜ |
| `equipment/edit-equipment` | `/app/equipment/:id/edit` | ⬜ |
| `equipment/equipment-details` | `/app/equipment/:id` (حجز + أعطال) | ✅ |
| `equipment/equipmentdetails` (القديم) | مدموج في السابق | ⬜ |
| `equipment/equipment-book` | مدموج في `/app/equipment/:id` | ✅ |
| `equipment/equipment-history` | `/app/equipment/:id/history` | ⬜ |
| `equipment/equipment-problems` | مدموج في `/app/equipment/:id` | ✅ |
| `equipment/equipment-reports` | `/app/equipment/reports` | ⬜ |
| `equipment/equipment-schedule` (Syncfusion Schedule) | `/app/equipment/schedule` (Gantt للقراءة) | ✅ |
| `equipment/equipment-schedule2` | مدموج في السابق | ⬜ |

> ⚠️ `equipment/schedule` هي أثقل شاشة في المشروع (Syncfusion Schedule).
> تحتاج إعادة بناء بـ CDK drag-drop + شبكة زمنية مخصّصة — خصّص لها جلسة كاملة.

---

## المرحلة 8 — المال والاشتراكات

| الأصل | الجديد | الحالة |
|---|---|---|
| `payments/payment-list` | `/app/disbursements` (سجلّ الصرف) | ✅ |
| `payments/payment-details` | `/app/disbursements/:id` (دورة حياة التحويل) | ✅ |
| `priceList/` (`ServicesPriceList`) | `/app/price-lists` | ⬜ |
| `priceList/editPlanInfo/:planId` | `/app/price-lists/plans/:planId` | ⬜ |
| `priceList/subCatPriceList/:catCode` | `/app/price-lists/categories/:catCode` | ⬜ |
| `priceList/editSubCatPriceList/:catId` | `/app/price-lists/categories/:catId/edit` | ⬜ |
| `pro/cards` (+ `ProCardsNew`) | `/app/account/payment-methods` | ⬜ |
| `pro/cards/:userId/:stripeCustomerId/view` | `/app/account/payment-methods/:id` | ⬜ |
| `pro/cards/create` | `/app/account/payment-methods/new` | ⬜ |
| `pro/cards/:userId/:stripeCustomerId/edit` | `/app/account/payment-methods/:id/edit` | ⬜ |
| `pro/createcard` | مدموج في السابق | ⬜ |
| `sub/enableVanlynk` | `/app/subscriptions/enable` | ⬜ |
| `sub/subscriptionHistory` (+ `/pro/:loginId`) | `/app/subscriptions/history` | ⬜ |
| `sub/vanlynkPaymentSubscriptionHistory` | `/app/subscriptions/platform/payments` | ⬜ |
| `sub/vanlynkPaymentHistory` | `/app/subscriptions/platform/payment-history` | ⬜ |
| `sub/vanlynkSubscriptionHistory` | `/app/subscriptions/platform/history` | ⬜ |
| `sub/vanlynkSubscriptionDetails` (+ `/pro/:loginId`) | `/app/subscriptions/platform/:id` | ⬜ |
| `sub/leadgenPaymentHistory` (+ `/pro/:loginId`) | `/app/subscriptions/leads/payments` | ⬜ |
| `sub/leadgenRefundRequests` (+ `/pro/:loginId`) | `/app/subscriptions/leads/refunds` | ⬜ |
| `sub/leadgenAccountHistory` (+ `/pro/:loginId`) | `/app/subscriptions/leads/history` | ⬜ |
| `sub/leadgenSubscriptionDetails` (+ `/pro/:loginId`) | `/app/subscriptions/leads/:id` | ⬜ |

> ❓ **قرار مطلوب:** منطق الاشتراكات (Vanlynk/Leadgen — 16 مسارًا) تجاري أمريكي بحت.
> أُبقي بالكامل التزامًا بقاعدة «لا حذف». إن كان خارج نطاق الإعمار، حذف هذه المرحلة
> يوفّر ~20% من العمل.

---

## المرحلة 9 — الإعدادات والصلاحيات

### إعدادات الحساب (`account_setting/`)
| الأصل | الجديد | الحالة |
|---|---|---|
| `accountSettings/:tab` و `:tab/:ctab` | `/app/account-settings/:tab` | ⬜ |
| `groupprofile` | `/app/account-settings/organisation` | ⬜ |
| `staffroledetails` | `/app/account-settings/roles/:id` | ⬜ |
| `permissions` | `/app/permissions` | ⬜ |
| `pricebookpackagedetails` | `/app/account-settings/pricebook-packages/:id` | ⬜ |
| `pricebookservicesubcategory` | `/app/account-settings/pricebook-subcategories/:id` | ⬜ |
| `inventorysubcategory` | `/app/account-settings/material-subcategories/:id` | ⬜ |
| `equipmentsubcategorydetails` | `/app/account-settings/equipment-subcategories/:id` | ⬜ |
| `equipmentstatus` | `/app/account-settings/equipment-statuses/:id` | ⬜ |
| `equipmentagreementdetails` | `/app/account-settings/equipment-agreement` | ⬜ |
| `loginagreementdetails` | `/app/account-settings/login-agreement` | ⬜ |
| `marketingmediadetails` | `/app/account-settings/marketing-media/:id` | ⬜ |
| `vendorcategorydetails` | `/app/account-settings/supplier-categories/:id` | ⬜ |

### الإعدادات العامة (`global-settings/`)
| الأصل | الجديد | الحالة |
|---|---|---|
| `unitOfMeasurements` + `editUnitOfMeasurements` | `/app/global-settings/units` (+ `/:id`) | ⬜ |
| `geofencingSetting` | `/app/global-settings/geofencing` | ⬜ |
| `timeCardActivites` + `editTimeCardActivites` | `/app/global-settings/timecard-activities` (+ `/:id`) | ⬜ |
| `paymentMethods` + `editPaymentMethods` | `/app/global-settings/payment-methods` (+ `/:id`) | ⬜ |
| `termsAndConditions` + `editTermsAndConditions` | `/app/global-settings/terms` (+ `/:id`) | ⬜ |
| `vendorCategories` + `editVendorCategory` | `/app/global-settings/supplier-categories` (+ `/:id`) | ⬜ |
| `salesAndMarketing` + `editSalesAndMarketing` | `/app/global-settings/outreach` (+ `/:id`) | ⬜ |

---

## المرحلة 10 — المتبقّي

| الأصل | الجديد | الحالة |
|---|---|---|
| `staff/stafflist` (+ `NewStaffList`) | `/app/staff` | ⬜ |
| `staff/staffprofile` (+ `StaffProfile`) | `/app/staff/:id` | ⬜ |
| `staff/timecard` | `/app/staff/timecards` | ⬜ |
| `staff/staff-timecard` | `/app/staff/:id/timecard` | ⬜ |
| `questions/standard-questions-list` | `/app/questions` | ⬜ |
| `questions/categories-list` | `/app/questions/categories` | ⬜ |
| `questions/subcategories-list` | `/app/questions/subcategories` | ⬜ |
| `questions/category-question-form` | `/app/questions/form` | ⬜ |
| `promotions/promotionlist` | `/app/campaigns` | ⬜ |
| `promotions/promotiondetails` | `/app/campaigns/:id` | ⬜ |
| `promotions/emailList` | `/app/campaigns/recipients` | ⬜ |
| `promotions/budget` | `/app/campaigns/budget` | ⬜ |
| `notifications/notificationsList` | `/app/notifications` | ✅ |
| `notifications/push-notifications` | `/app/notifications/push` | ⬜ |
| `social/yelp` | `/app/external-ratings/yelp` | ⬜ |
| `social/google` | `/app/external-ratings/google` | ⬜ |
| `support/customer-tickets` | `/app/support` | ✅ |
| `support/ticket/:ticketId` | `/app/support/:id` (محادثة + رد) | ✅ |
| `scorecard/scorecardHome` | `/app/scorecards` | ⬜ |
| `scorecard/scorecardGeneration` | `/app/scorecards/new` | ⬜ |
| `logs/twilliosms` | `/app/logs/sms` | ⬜ |
| `logs/twilliosendgridMail` | `/app/logs/email` | ⬜ |
| `not-found` | `**` | ✅ |

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
