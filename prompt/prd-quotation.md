# **PRD \- CORE4 \- Unity Panel: Quotation**

**Author:** Bobby

**Date:** Oct 5, 2026

**Status:** Draft

**Abstract:** Build the Quotation module in Unity Panel using the CORE2 quotation tables as the base, moved to the CORE4 database and tied to one company. Quotation uses the Client Profile and Master Data already defined in the earlier CORE4 PRDs. This PRD covers quotation create/edit, product lines, price and totals, payment terms, brands, tags, attachments, PDF, status, and Convert to Sales Order.

---

# **1\. Background & Context**

**BRD:** No dedicated BRD. Closest reference: PRD \- CORE2 \- CORE4 Migration.

**Related PRDs:**

* [PRD - CORE4 - Master Data Client Profile](https://docs.google.com/document/u/0/d/1LKpeutVpRgQDhU12Nyo1K-OE8ejUITBkGnmltwKnsP0/edit)  
* [PRD - CORE4 - Master Data Product](https://docs.google.com/document/u/0/d/1Qi8XJJGvc1LVxi4sNfIOpIiz02KpKIUeEeyt0ErrnSE/edit)  
* [PRD - CORE4 - RBAC Builder](https://docs.google.com/document/u/0/d/11KkEjPxIDlHaH55YOW2jDgvPMu2SUa-ZGiiZ1n0AMfE/edit)

**Current situation:**

* Quotation lives in CORE2 (cpnQuotationNumber and related tables) and is tied to Country (masCountry\_id).  
* Unity Panel already separates data per company (Client, Product, RBAC), but Quotation is not on that structure yet.  
* Finance gave feedback in CORE2 about price format, decimals on rate price, and final price limits (CORE4 Improvement 1.3.0).

**Solution:** Rebuild Quotation in CORE4 following the ERD. One quotation belongs to one company. Client, Contact, Product, and Sales must belong to or be allowed for that company. A quotation that is converted to Sales Order stays the same record (there is no separate Sales Order table in the ERD).

**Expected impact:** One clear quotation structure for Sales and Finance, correct totals on screen and PDF, and a clean base for Work Order, Campaign routing, and NetSuite/Jurnal.id later.

---

# **2\. Goal & Objectives**

•     Sales can create, edit, print, and convert quotations in CORE4 without CORE2.

•     Every quotation is tied to exactly one company, and no data from another company can be mixed in.

•     Prices, discount, VAT, and Grand Total are calculated and shown the same way on screen and PDF.

•     Keep the quotation data ready for Work Order, Campaign, NetSuite, and Jurnal.id (fields kept, logic not built here).

---

# **3\. Success Metrics**

•     0 quotations in QA/UAT with Client, Contact, or Product from a different company than the quotation.

•     100% of tested quotations have the same Grand Total on screen, in the PDF, and in the CORE2 parity sample (20 quotations).

•     0 duplicate quotation numbers, including a test with parallel creation.

•     No feedback from Finance about price format or rounding in the first sprint after release.

**•     Need to improve on Company before this Quotation feature is developed.**

---

# **4\. Requirements**

## **4.1 Functional Requirements**

| \`\`\`mermaiderDiagram	direction TB	masCompany {		bigint id PK ""		varchar uuid  ""		varchar name  ""		text quotationPdfNotes  ""		text quotationPdfCustomerData  ""		text quotationPdfCancellationPolicy  ""		text quotationPdfTermsAndCondition  ""		varchar abbr  ""		bigint increment  ""		varchar logoImage  ""		varchar address  ""		varchar url  ""		varchar phone  ""		text paymentTo  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masProduct {		bigint id PK ""		varchar uuid  ""		int masCompany\_id FK ""		int masProductCategory\_id FK ""		varchar name  ""		varchar image  ""		varchar quantityUnit  ""		varchar durationUnit  ""		tinyint active  ""		int usrAdminProfile\_verifiedBy\_id FK ""		datetime verifiedAt  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masProductCategory {		bigint id PK ""		varchar uuid  ""		varchar name  ""		varchar image  ""		varchar quantityUnit  ""		varchar durationUnit  ""		tinyint isCampaignable  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masPrice {		bigint id PK ""		varchar uuid  ""		varchar name  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masProductPrice {		bigint id PK ""		varchar uuid  ""		int masProduct\_id FK ""		int masPrice\_id FK ""		float\_14\_2 price ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masQuotationTermMoment {		bigint id PK ""		varchar uuid  ""		varchar text  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masQuotationTermDue {		bigint id PK ""		varchar uuid  ""		varchar text  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masCity {		bigint id PK ""		varchar uuid  ""		varchar name  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masBrand {		bigint id PK ""		varchar uuid  ""		varchar text  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	usrClientProfile {		bigint id PK ""		varchar uuid  ""		int masCompany\_id FK ""		varchar email  ""		varchar phoneNumber  ""		varchar name  ""		varchar brandText  ""		varchar website  ""		varchar taxNumber  ""		varchar taxImage  ""		varchar siupImage  ""		varchar tdpImage  ""		varchar domisiliImage  ""		text billingAddress  ""		int masCity\_id FK ""		int masBrand\_id FK ""		varchar zipCode  ""		int usrAdminProfile\_verifiedBy\_id FK ""		datetime verifiedAt  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	usrClientBilling {		bigint id PK ""		varchar uuid  ""		bigint usrClientProfile\_id FK ""		varchar name  ""		varchar email  ""		varchar phoneNumber  ""		varchar mobileNumber  ""		varchar faxNumber  ""		text billingAddress  ""		text shippingAddress  ""		tinyint primary  ""		varchar npwp  ""		varchar ktp  ""		varchar npwpImage  ""		varchar ktpImage  ""		text extra  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	usrClientContact {		bigint id PK ""		varchar uuid  ""		bigint usrClientProfile\_id FK ""		varchar name  ""		varchar salutation  ""		varchar email  ""		varchar officeEmail  ""		timestamp email\_verified\_at  ""		varchar phoneNumber  ""		varchar position  ""		varchar password  ""		varchar remember\_token  ""		varchar passwordResetToken  ""		tinyint active  ""		tinyint primaryContact  ""		int usrAdminProfile\_verifiedBy\_id FK ""		datetime verifiedAt  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	usrClientBankAccount {		bigint id PK ""		varchar uuid  ""		bigint usrClientProfile\_id FK ""		varchar masBank\_id FK ""		varchar holder  ""		varchar number  ""		varchar branch  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masBank {		bigint id PK ""		varchar uuid  ""		varchar name  ""		int code  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	usrAdminProfile {		bigint id PK ""		varchar uuid  ""		varchar email  ""		longtext companies  ""		varchar name  ""		varchar jasnitaUsername  ""		varchar jasnitaPassword  ""		date suspendedAt  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	roles {		bigint id PK ""		varchar name  ""		varchar guard\_name  ""		timestamp created\_at  ""		timestamp updated\_at  ""	}	model\_has\_roles {		bigint role\_id FK ""		varchar model\_type  ""		bigint model\_id  ""	}	model\_has\_permissions {		bigint permission\_id FK ""		varchar model\_type  ""		bigint model\_id  ""	}	qtnQuotationNumber {		bigint id PK ""		char uuid  ""		bigint masCompany\_id FK ""		bigint usrClientProfile\_id FK ""		bigint usrClientContact\_id FK ""		bigint usrAdminProfile\_sales\_id FK ""		bigint masBrand\_id FK ""		varchar quotationNumber  ""		varchar quotationNumberTag  ""		varchar name  ""		varchar status  ""		int correction  ""		varchar image  ""		date expiredDate  ""		text pdfData  ""		tinyint isBulkOrder  ""		tinyint createdYear  ""		tinyint yearlyIncrement  ""		datetime cancelledAt  ""		datetime quotationAt  ""		datetime soAt  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	qtnQuotationNumberBrand {		bigint qtnQuotationNumber\_id FK ""		bigint masBrand\_id FK ""	}	qtnQuotationNumberProduct {		bigint id PK ""		char uuid  ""		bigint qtnQuotationNumber\_id FK ""		bigint masProduct\_id FK ""		bigint masCity\_id FK ""		date startDate  ""		text description  ""		varchar duration  ""		decimal\_14\_2 price  ""		int quantity  ""		decimal\_14\_2 discount  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	qtnQuotationNumberTerm {		bigint id PK ""		char uuid  ""		bigint qtnQuotationNumber\_id FK ""		bigint masQuotationTermMoment\_id FK ""		bigint masQuotationTermDue\_id FK ""		decimal\_6\_2 percent  ""		int period  ""		timestamp created\_at  ""		timestamp updated\_at  ""		timestamp deleted\_at  ""	}	masCompany ||..o{ masProduct : "has"	usrAdminProfile ||..o{ masProduct : "verifies"	masProductCategory ||..o{ masProduct : "has"	masProduct ||..o{ masProductPrice : "has"	masPrice ||..o{ masProductPrice : "has"	masProduct }o..o{ masPrice : "priced via masProductPrice"	masCity ||..o{ usrClientProfile : "has"	masBrand ||..o{ usrClientProfile : "has"	masCompany ||..o{ usrClientProfile : "has"	usrAdminProfile ||..o{ usrClientProfile : "verifies"	usrClientProfile ||..o{ usrClientBilling : "has"	usrClientProfile ||..o{ usrClientContact : "has"	usrAdminProfile ||..o{ usrClientContact : "verifies"	usrClientProfile ||..o{ usrClientBankAccount : "has"	masBank ||..o{ usrClientBankAccount : "has"	roles ||..o{ model\_has\_roles : "has"	masCompany ||..o{ qtnQuotationNumber : "has"	usrClientProfile ||..o{ qtnQuotationNumber : "has"	usrClientContact ||..o{ qtnQuotationNumber : "has"	usrAdminProfile ||..o{ qtnQuotationNumber : "sells"	masBrand ||..o{ qtnQuotationNumber : "has"	qtnQuotationNumber }o..o{ masBrand : "tagged via    qtnQuotationNumberBrand"	qtnQuotationNumber ||..o{ qtnQuotationNumberProduct : "has"	masProduct ||..o{ qtnQuotationNumberProduct : "has"	masCity ||..o{ qtnQuotationNumberProduct : "has"	qtnQuotationNumber ||..o{ qtnQuotationNumberTerm : "has"	masQuotationTermMoment ||..o{ qtnQuotationNumberTerm : "has"	masQuotationTermDue ||..o{ qtnQuotationNumberTerm : "has"\`\`\` |
| :---- |
|  |

## **4.1.1 Data taken from other PRDs**

| Data | Source PRD | Used in Quotation as | Rule in Quotation |
| :---- | :---- | :---- | :---- |
| Company (masCompany) | Master Data: Product 1.0.0 / Auth sync | Quotation company, number prefix, PDF content | Required. Only companies the user is allowed to access. Locked after first save. |
| Client Profile (usrClientProfile) | Master Data: Client 1.2 | Client | Must have the same masCompany\_id as the quotation. |
| Client Contact (usrClientContact) | Master Data: Client 1.2 | Contact person | Must belong to the selected Client. |
| Sales (usrAdminProfile) | Auth sync / RBAC | Sales owner | Default is the logged-in user. Can be changed only with quotationnumber:select-sales. |
| Product (masProduct) | Master Data: Product 1.0.0 | Product line | Active and same masCompany\_id as the quotation. |
| Product Price \+ Price (masProductPrice, masPrice) | Master Data: Product 1.0.0 | Rate Card choices on a product line | Only prices of the selected Product. |
| City (masCity) | Master Data: Product 1.0.0 | City on a product line | Required. |
| Brand (masBrand) | Master Data: Product 1.0.0 | Brands on the quotation | One or more brands. |
| Term Moment / Term Due | Master Data: Product 1.0.0 | Payment terms | Text is unique and cannot be edited, so old quotations never change. |

 

**Verify rule:** Lead quotations can use any Client, Contact, and Product of the company (Sales needs to quote prospects before Finance verifies them). **Convert to Sales Order** needs verifiedAt filled on the Client Profile, the Contact, and every Product in the lines.

## **4.1.2 Quotation List**

•     Columns: Quotation Number, Name, Client, Brand(s), Sales, Status, Expired Date, Grand Total, Created At, Action.

•     Filters: Company, Status, Client, Sales, Tag, Created date range, Expired date range. Search by Quotation Number, Name, Client.

•     The user only sees quotations of companies in their access list (usrAdminProfile.companies). Enforced on list, detail, PDF, attachment download, and export.

•     Download CSV: same columns as the list. With no filter it downloads all data. With a filter it downloads all filtered data, not only the current page.

## **4.1.3 Create / Edit Quotation (header)**

| Field | ERD field | Rule |
| :---- | :---- | :---- |
| Company | masCompany\_id (new, replaces masCountry\_id) | Required. Locked after first save because it decides the number prefix. |
| Quotation Number | quotationNumber | Auto generated (4.1.8). Read-only. Only users with quotationnumber:edit-number can edit, and it must stay unique per company. |
| Quotation Name | name | Required. |
| Client | usrClientProfile\_id | Required. Same company. |
| Contact | usrClientContact\_id | Required. Must belong to the Client. Changing Client clears Contact. |
| Sales | usrAdminProfile\_id | Required. Default logged-in user. |
| Brand(s) | cpnQuotationNumberBrand | One or more. The old single masBrand\_id is not migrated. |
| Status | status (enum) | See 4.1.7. |
| Expired Date | expiredDate | Required. Cannot be before today when the quotation is created. |
| Bulk Order | isBulkOrder | Toggle, default off. |
| Image | image | Optional. |
| Tag | trtTag | Optional, many tags. |
| Attachments | trtAttachment | Optional. See 4.1.9. |
| System fields | correction, quotationNumberTag, pdfData, jurnalidSalesQuotationId, jurnalidSalesOrderId, netsuiteSalesOrderId, cancelledAt | Not editable by user. correction and quotationNumberTag behave like CORE2 \[VERIFY\]. Jurnal.id and NetSuite IDs stay empty until the sync PRD. |

When creating quotation in pop up modal then sales should be automatically GET from StickEarn Auth, unless the role is ain’t sales then can be choose who’s the sales is.

## **4.1.4 Product Lines**

Lines are added from an "Add Product" modal and shown in a table: Product, Quantity, Duration, City, Est. Date, Rate Card, Price, Discount, Subtotal.

| Field | ERD field | Rule |
| :---- | :---- | :---- |
| Product | masProduct\_id | Required. Active, same company. |
| City | masCity\_id | Required. |
| Est. Date | startDate | Required. |
| Description | description | Optional. |
| Duration | duration | Required, more than 0\. Unit comes from the Product (durationUnit). |
| Quantity | quantity | Required, at least 1\. Unit comes from the Product (quantityUnit). |
| Rate Card | from masProductPrice / masPrice | Pick one price of the Product. Default price comes from Master Data. \[GAP\] The ERD line has no field to keep which rate card or rate amount was used (R-02). |
| Price (Final Price) | price decimal(14,2) | Default \= Rate Card price. Can be changed in the modal, and can be higher than the Rate Card price. Changing it needs quotationnumber:custom-price. Every change is logged with old value, new value, user, and time. |
| Discount | discount decimal(14,2) | Optional. Amount in Rupiah, 0 or more, cannot be more than the line amount before discount. \[VERIFY\] whether CORE2 discount is amount or percent. |
| Subtotal | calculated, not stored | See 4.1.5. |

 

•     A quotation with no lines can be saved as Lead, but cannot be printed or converted.

•     If a Product is deactivated later, existing lines stay unchanged. The Product cannot be added to new lines.

## **4.1.5 Totals, Rounding, and Price Format**

**Calculation** (target formula, confirm against CORE2 before build):

* Perline:  
  * subtotal            \= price × quantity × duration         		   // Before discount (rate card)  
  * discountedSubtotal  \= discountedPrice × quantity × duration // After discount  
* Discount per line:  
  * discount \= price − discountedPrice   // perline  
* Total Price before discount:

| total \= Σ (subtotal \== 0 || masProductVehicle\_id \== 17) ? discountedSubtotal : parseInt(subtotal) |
| :---- |

* Total Price after discount:

| totalDiscount \= Σ (subtotal \== 0 || vehicle\_id \== 17)                  ? 0                  : (price − discountedPrice) × quantity × durationguard: isNaN → 0 |
| :---- |


| totalPrice    \= Σ (subtotal \== 0 || productVehicle\_id \== 17) ? (int)finalSubtotal : (int)subtotaltotalDiscount \= Σ (subtotal \== 0 || vehicle\_id \== 17)                  ? 0 : ((int)ratePrice − (int)finalPrice) × quantity × durationtotal         \= Σ (int)finalSubtotaltotalVat      \= round(total × (pdfData.vat ?? 10) / 100)grandTotal    \= round(total \+ total × (pdfData.vat ?? 10) / 100)   // ← SUDAH termasuk VAT |
| :---- |

  •     VAT % is a system variable, not hardcoded. Current effective rate is 11% (12% rate on 11/12 of the base for non-luxury services).

**Rounding:** round to the nearest whole Rupiah. Below 0.50 is rounded down (Rp100.25 to Rp100). 0.50 and above is rounded up (Rp100.55 to Rp101). Round each line Subtotal first, then calculate VAT on the rounded Total, then round VAT. Grand Total \= rounded Total \+ rounded VAT, so screen and PDF always match.

**Price format:**

•     Product list: xx.xxx.xxx (example 25.516.718).

•     Total Price until Grand Total, and the PDF: Rp xx.xxx.xxx (example Rp 25.516.718).

•     Price input accepts whole numbers without commas, and the detail page must not show decimals that were never entered.

•     Money is stored as decimal(14,2) and calculated with decimal math, never float.

•     **\[GAP\]** Totals are not stored in the ERD, so a change in VAT % or rounding would change old quotations (R-01). From Convert to Sales Order onward the totals must be frozen.

## **4.1.6 Payment Terms**

Rows in the "Terms of Payment" block (cpnQuotationTerm). Add and remove rows.

| Field | ERD field | Rule |
| :---- | :---- | :---- |
| Percent | percent decimal(6,2) | Required, more than 0 and up to 100\. |
| Period | period (int) | Required, 0 or more (days). |
| Moment | masQuotationTermMoment\_id | Required. Pick from Master Data. |
| Due | masQuotationTermDue\_id | Required. Pick from Master Data. |

 

•     Total percent of all rows must be exactly 100.00 to print or convert. Lead can be saved with any total.

•     Terms of Payment on **“Before Campaign Installed”** then the Due is removed.

## **4.1.7 Status and Actions**

| Status | Meaning and rules |
| :---- | :---- |
| Lead | Prospect quotation. Zero state (with no product inside) Fully editable. |
| Filled | Quotation with filled product, terms of payment, etc. Ready to send to Client. |
| Signed | The client already signed the quotation. |
| Sales Order | Result of Convert. Header, lines, and terms are locked. Only Tags and Attachments can still change. Cannot be cancelled or deleted in this version. |

 

•     **Convert to Sales Order** (permission quotationnumber:convert): allowed from Lead when there is at least 1 line, payment terms total 100%, Expired Date is not passed, and Client Profile, Contact, and all Products are verified. A confirmation shows the Grand Total before the status changes. Convert does not create a Work Order or Campaign.

•     **Cancel** (quotationnumber:cancel): from Lead, with confirmation.

•     **Delete** (quotationnumber:delete): soft delete (deleted\_at), only Lead.

•     Every create, update, status change, price change, number edit, attachment change, convert, and cancel is written to the activity log with user, time, and old/new value.

## **4.1.8 Quotation Number**

•     Format: {Company abbr}-{month in Roman}-{yy}-{increment 4 digits}, example VOC-III-26-0001 (abbr and increment come from masCompany).

•     Month and year use Asia/Jakarta time.

•     Increment goes up by 1 for each new quotation of the company and is never reused, even after Cancel or Delete.

•     Generation must be atomic (row lock) and unique per (masCompany\_id, quotationNumber). Whether the increment resets each month/year follows CORE2 **\[VERIFY\]**.

## **4.1.9 Tags and Attachments (Pending)**

•     Tags: free text, many per quotation, stored in trtTag (model\_type \= quotation). Tag filter on the list.

•     Attachments: upload, list, download, delete (trtAttachment: url \+ info). Permissions: quotationnumber.attachment:read / write / delete. File type and size limit follow CORE2.

•     Files are private. Download links must check company access.

## **4.1.10 PDF (Save & Print / Download PDF)**

•     Content from masCompany: logoImage, name, address, phone, url, quotationPdfNotes, quotationPdfCustomerData, quotationPdfCancellationPolicy, quotationPdfTermsAndCondition, paymentTo.

•     Content from quotation: number, name, client and contact, brands, product table, payment terms, Total Price, Discount, VAT, Grand Total, Expired Date. Amounts use the Rp format in 4.1.5.

•     Save & Print saves the quotation, generates the PDF, keeps it in pdfData, and downloads it. **\[GAP\]** pdfData is TEXT in the ERD, which is too small for a PDF with images (R-03).

•     PDF Setting page per company: edit the four quotationPdf\* text fields. Other company fields come from Auth sync and are read-only here. Permissions: quotationnumber.pdf-setting:read / write.

## **4.1.11 Quotations tab on Client Profile**

•     Read-only list of the client's quotations (Number, Name, Status, Expired Date, Grand Total) with a link to the detail. Permission client-quotation:read. The Client Profile itself follows Master Data: Client 1.2.

## **4.1.12 UI**

Wireframe: attach CORE4 screenshots of the Quotation list, form, and Add Product modal here before prescreening.

## **4.2 Technical Requirements**

## **4.2.1 Database Schema**

Follow the quotation ERD. Changes compared with CORE2 are listed in the last column.

| Table | Fields | Change from CORE2 |
| :---- | :---- | :---- |
| cpnQuotationNumber | id, uuid, masCompany\_id, usrClientProfile\_id, usrClientContact\_id, usrAdminProfile\_id, quotationNumber, quotationNumberTag, name, status, correction, image, expiredDate, jurnalidSalesQuotationId, jurnalidSalesOrderId, netsuiteSalesOrderId, pdfData, isBulkOrder, cancelledAt, created\_at, updated\_at, deleted\_at | Add masCompany\_id (replaces masCountry\_id). Drop masBrand\_id (deprecated). Unique (masCompany\_id, quotationNumber). |
| cpnQuotationNumberProduct | id, uuid, masProduct\_id, cpnQuotationNumber\_id, masCity\_id, startDate, description, duration, price decimal(14,2), quantity, discount decimal(14,2), timestamps, deleted\_at | No change. \[GAP\] rate card snapshot (R-02). |
| cpnQuotationTerm | id, uuid, percent decimal(6,2), period, masQuotationTermMoment\_id, masQuotationTermDue\_id, cpnQuotationNumber\_id, timestamps, deleted\_at | The ERD names the last FK cpnQuotationTerm\_id, but it links to the quotation. Use cpnQuotationNumber\_id. |
| cpnQuotationNumberBrand | masBrand\_id, cpnQuotationNumber\_id (composite PK) | Becomes the only brand link. |
| trtTag | id, uuid, model\_id, model\_type, text, timestamps, deleted\_at | No change. |
| trtAttachment | id, uuid, model\_id, model\_type, url, info, timestamps, deleted\_at | No change. |
| cpnQuotationInvoice | \- | Not migrated (unused). |

 

•     All id and FK columns use the same type (bigint unsigned). The CORE2 ERD mixes int(11) and bigint(20).

•     Indexes: (masCompany\_id, status), expiredDate, usrClientProfile\_id, usrAdminProfile\_id.

•     Cross-company checks (Client, Contact, Product vs quotation company) are done in the application, because a foreign key cannot check them.

•     masProductPrice.price is float\_14\_2 in the Product ERD. It must be decimal(14,2) like the quotation line (R-07).

•     masProduct no longer has NetSuite/Jurnal product fields, while the quotation keeps NetSuite/Jurnal IDs. Product mapping must be decided in the sync PRD.

## **4.2.2 Permissions**

Keys are declared in the page/API config of the RBAC generator and auto-granted to Superadmin.

| Permission | Use |
| :---- | :---- |
| quotationnumber:read | List, detail, PDF download, CSV export |
| quotationnumber:write | Create and edit Lead |
| quotationnumber:select-sales | Change Sales on a quotation \- Default by their own account, but can be changed who’s creating the quote. |
| quotationnumber:custom-price | Change Final Price away from Rate Card |
| quotationnumber:edit-number | Edit quotation number |
| quotationnumber:convert-signed (new) | Convert to Signed Quote |
| quotationnumber:convert-so (new) | Convert to Sales Order |
| quotationnumber:delete (new) | Delete Lead |
| quotationnumber.attachment:read / write / delete | Attachments \- PENDING. |
| client-quotation:read | Quotations tab on Client Profile |

 

convert, cancel, and delete are split from CORE2 quotationnumber:write because they change money and status (action-level permission, see CORE4-123). Existing roles must be mapped to the new keys. quotationnumber:dummy-data is not migrated.

**Need confirmation for showing price to ops (Finance).**

## **4.2.3 Filament**

•     Quotation Resource with List, Create, Edit, View. Actions: Save, Save & Print, Download PDF, Convert, Cancel, Delete, Export CSV.

•     Relation/sections: Product Lines, Payment Terms, Brands, Tags, Attachments, Activity Log. Quotations relation on Client Profile (read-only).

•     Company scope is applied in the Resource query, and every action checks permission and company on the server. A hidden button is not enough.

•     No separate REST API in this version, same as Master Data and Client.

## **4.3 Acceptance Criteria**

**AC 1 \- Company scope**

•     **\[Positive\]** Given a user can access Company A only, When they open the quotation list, Then they see only Company A quotations.

•     **\[Negative\]** Given a user can access Company A only, When they open a Company B quotation by URL, PDF link, or attachment link, Then access is denied.

**AC 2 \- Create and number**

•     **\[Positive\]** Given Company VOC and the 1st quotation in March 2026, When Sales saves it, Then the number is VOC-III-26-0001 and the next one is VOC-III-26-0002.

•     **\[Negative\]** Given 50 quotations are created at the same time in one company, When all are saved, Then all numbers are different.

•     **\[Negative\]** Given a Client of Company B, When Sales creates a quotation in Company A, Then the Client cannot be selected and a direct request is rejected.

**AC 3 \- Product line and price**

•     **\[Positive\]** Given a Product with Rate Card Rp 10.000.000, When Sales adds it, Then Price defaults to Rp 10.000.000.

•     **\[Positive\]** Given a user with quotationnumber:custom-price, When they set Price to Rp 12.000.000, Then it is saved and the change is in the activity log.

•     **\[Negative\]** Given a user without quotationnumber:custom-price, When they try to change Price, Then the field is read-only and a direct request is rejected.

**AC 4 \- Totals and rounding**

•     **\[Positive\]** Given 1 line with Price Rp 10.000.000, Quantity 2, Duration 1, Discount Rp 1.000.000 and VAT 11%, Then Subtotal is Rp 19.000.000, VAT is Rp 2.090.000, Grand Total is Rp 21.090.000, on screen and in the PDF.

•     **\[Positive\]** Given a value of Rp 100,55, Then it is shown as Rp 101\. Given Rp 100,25, Then it is shown as Rp 100\.

•     **\[Negative\]** Given a Sales Order and VAT % changed in system variables, When the quotation is opened, Then its totals do not change.

**AC 5 \- Payment terms**

•     **\[Positive\]** Given terms of 30% and 70%, When Sales converts, Then it is accepted.

•     **\[Negative\]** Given terms of 30% and 60%, When Sales prints or converts, Then it is blocked with the message that the total must be 100%.

**AC 6 \- Convert to Sales Order**

•     **\[Positive\]** Given a Lead with lines, 100% terms, and verified Client, Contact, and Products, When Sales confirms Convert, Then status is Sales Order and the header, lines, and terms are locked.

•     **\[Negative\]** Given the Client Profile is not verified, When Sales converts, Then it is blocked and the message names the unverified Client.

•     **\[Negative\]** Given Expired Date has passed, When Sales converts, Then it is blocked until the date is extended.

**AC 7 \- Cancel, delete, lock**

•     **\[Positive\]** Given a Lead, When Cancel is confirmed, Then status is Cancelled and cancelledAt is filled.

•     **\[Negative\]** Given a Sales Order, Then Edit, Cancel, and Delete are not available.

**AC 8 \- PDF and export**

•     **\[Positive\]** Given a quotation with company logo and long Terms & Conditions, When Save & Print is used, Then the full PDF downloads with no text cut.

•     **\[Positive\]** Given a filter on Status and a date range, When Export CSV is used, Then the file has all filtered rows, not only page 1\.

# **5\. Non-Functional Requirements**

•     Security: company access and permission checked on the server for every read and write, including PDF, CSV, and attachment links.

•     Auditability: all changes in 4.1.7 are in the activity log.

•     Data accuracy: decimal math only. Rounding rules are one shared function used by screen, PDF, and export.

•     Performance: targets for list loading and PDF generation are set by QA before prescreening.

•     Edge cases: Client or Product becomes unverified after the quotation exists (existing quotation stays, Convert is blocked); Product deactivated after being added; Master Data term text cannot change; month in the number uses Asia/Jakarta time; two users edit the same quotation at the same time (last save must not silently overwrite, show a conflict message).

# **9\. Proposed Jira Tickets (epic: Finance Panel \- Quotation)**

| Key | Type | Title | Covers |
| :---- | :---- | :---- | :---- |
| QT-01 | BE | DB Migration \- Quotation tables | 4.2.1, R-02, R-07, R-08, R-09 |
| QT-02 | BE | Spike \- extract CORE2 quotation logic (status, Subtotal, discount, correction, number reset) | R-06, R-12 |
| QT-03 | BE | Quotation Number generator (atomic) | 4.1.8 |
| QT-04 | BE | Quotation CRUD \- header, brands, company scope and validation | 4.1.1, 4.1.3 |
| QT-05 | BE | Quotation Product Lines \- rate card, custom price, audit | 4.1.4 |
| QT-06 | BE | Totals, VAT variable, rounding, price format, snapshot | 4.1.5 |
| QT-07 | BE | Quotation Payment Terms | 4.1.6 |
| QT-08 | BE | Status actions \- Convert, Cancel, Delete, lock | 4.1.7 |
| QT-09 | BE | Quotation PDF and PDF Setting page | 4.1.10 |
| QT-10 | BE | Quotation Tags and Attachments | 4.1.9 |
| QT-11 | BE | Quotation permissions and role mapping | 4.2.2 |
| QT-12 | BE | Quotation List, filters, CSV export, Client Quotations tab | 4.1.2, 4.1.11 |
| QT-13 | QA | Functional E2E test cases (AC 1-8) | Section 4.3 |
| QT-14 | QA | Calculation parity test \- 20 CORE2 quotations vs CORE4 | R-01, R-06 |
| QT-15 | QA | Company isolation and permission matrix test | R-04, R-10 |
| QT-16 | QA | Concurrency (50 parallel numbers) and large PDF test | R-03, R-05 |

 

