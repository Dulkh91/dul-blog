## Expand-track
Firebase Firestore
<details>
  <summary>Show Create Field</summary>

  1. Collection: users 

  បង្កើត Collection ឈ្មោះ users។

Field|	Type	|Example
------|-----|--------
displayName	|string|	Dul
email	|string	|dul@example.com
photoURL	|string	|https://...
createdAt	|timestamp	|Current timestamp


2. Collection: workspaces

Field|	Type	|Example
-----|-------|---------
name	|string|	My Personal Finance
type	|string|	PERSONAL
ownerUid	|string	|Firebase UID
currency	|string	|USD
createdAt	|timestamp	|Current timestamp

3. Subcollection: members

Field|	Type	|Example
------|-----|------
role	|string	|OWNER
joinedAt	|timestamp	|Current timestamp

4. Subcollection: transactions

Document ID៖ Auto-ID។

សំខាន់បំផុត

Field	|Type	|Example
------|-----|-------
title	|string	|Buy food
amountMinor	|number|	500
currency	|string	|USD
type	|string	|EXPENSE
categoryId	|string	|food
note	|string	|Lunch
createdBy	|string	|Firebase UID
occurredAt	|timestamp	|Date of transaction
createdAt	|timestamp	|Current timestamp

ការរក្សាទុកប្រាក់៖

- $5.00 = 500 cents
- $10.50 = 1050 cents
- 5,000៛ = 5000 riel

កុំប្រើ float សម្រាប់គណនាចំនួនប្រាក់។


5. Subcollection: categories

Path៖ workspaces/{workspaceId}/categories

Field	|Type	|Example
------|-----|-----
name	|string	|Food
icon	|string	|utensils
type	|string	|EXPENSE
isDefault|	boolean|	true
createdAt	|timestamp	|Current timestamp

ឧទាហរណ៍ Category ដែលអាចបង្កើត៖

Expense|	Income
-----|------
Food	|Salary
Transport|	Freelance
Shopping	|Business
Health|	Other Income
Bills|


6. Subcollection: budgets

Path៖ workspaces/{workspaceId}/budgets
Field	|Type|	Example
-----|-------|-----
name	|string	|Monthly |Food Budget
categoryId|	string	|food
amountMinor	|number	|10000
currency	|string|	USD
period	|string	|MONTHLY
startDate	|timestamp	|Start date
endDate	|timestamp	|End date
createdAt	|timestamp	|Current timestamp

<details>



### Google auth
### គំនិតសំខាន់
Google login គឺជាវិធីឱ្យ Google បញ្ជាក់ថា «អ្នកនេះជានរណា» ជំនួសឱ្យគេហទំព័ររបស់អ្នកទទួល និងរក្សាទុកពាក្យសម្ងាត់របស់អ្នកប្រើ។ ក្នុងគម្រោងនេះ កម្មវិធីទទួលព័ត៌មានប្រវត្តិរូបពី Google បន្ទាប់មកពិនិត្យថា email មានសិទ្ធិចូលឬអត់ ហើយបង្កើត session សម្រាប់ឱ្យអ្នកប្រើបន្តប្រើគេហទំព័រ។
ពាក្យសំខាន់៖
- Authentication៖ បញ្ជាក់អត្តសញ្ញាណ—អ្នកជានរណា។
- Authorization៖ ពិនិត្យសិទ្ធិ—អ្នកអាចចូលឬធ្វើអ្វីបានខ្លះ។
- Session៖ សញ្ញាសម្គាល់ថាកម្មវិធីបានផ្ទៀងផ្ទាត់អ្នករួចហើយ។
- Cookie៖ ទិន្នន័យតូចដែល browser ផ្ញើត្រឡប់ទៅ server សម្រាប់សំណើបន្ទាប់ៗ។
ដំណើរការតាមលំដាប់
<details>
<summary>Click Showmore</summary>

1. បើកទំព័រ Login

ទំព័រ login.astro ហៅ getSessionUser() មុនបង្ហាញមាតិកា៖
- បើមាន session ត្រឹមត្រូវ វាបង្ហាញថាបានចូលជា user ណា និងបង្ហាញប៊ូតុងទៅ Dashboard ឬចាកចេញ។
- បើមិនទាន់ចូល វាបង្ហាញប៊ូតុង «បន្តជាមួយ Google»។

ប៊ូតុងនេះមិនទាន់ចូល Google ដោយផ្ទាល់ទេ។ វាបញ្ជូន browser ទៅ endpoint ក្នុងគេហទំព័ររបស់យើង៖/api/auth/google/google។

2. Server រៀបចំសំណើទៅ Google

Endpoint google.ts ធ្វើការងារមួយចំនួន មុនបញ្ជូន browser ទៅ Google៖

1. អាន GOOGLE_CLIENT_ID និងពិនិត្យថា credentials ត្រូវបានកំណត់។
2. បង្កើតតម្លៃចៃដន្យ state និង verifier។
3. រក្សាទុក state, verifier និងទំព័រដែលចង់ត្រឡប់ទៅក្នុង cookies។
4. បង្កើត URL ស្នើសុំទៅ Google ហើយបញ្ជូន browser ទៅទីនោះ។

Google ទទួលប៉ារ៉ាម៉ែត្រដូចជា៖

- client_id៖ កំណត់ថា application ណាកំពុងស្នើ login។
- redirect_uri៖ អាសយដ្ឋាន callback ដែល Google ត្រូវត្រឡប់មកក្រោយ។
- scope: openid email profile៖ ស្នើអត្តសញ្ញាណ និងព័ត៌មាន email/profile មូលដ្ឋាន។
- state៖ តម្លៃសម្រាប់ពិនិត្យថាការត្រឡប់មកនេះជាការបន្តពី login ដែលយើងបានចាប់ផ្ដើម។
- code_challenge៖ ផ្នែកនៃការការពារ PKCE ដើម្បីឱ្យអ្នកទីបីមិនអាចយក authorization code ទៅប្រើបានងាយ។
- prompt: select_account៖ ស្នើឱ្យអ្នកប្រើជ្រើសរើស Google account។

Cookies សម្រាប់ដំណាក់កាលនេះផុតកំណត់ក្រោយ 10 នាទី។ វាមិនមែនជា session login ចុងក្រោយទេ—វាគ្រាន់តែជាទិន្នន័យបណ្ដោះអាសន្នសម្រាប់ដំណើរការ OAuth។

3. អ្នកប្រើចូលនៅលើ Google

Browser បង្ហាញទំព័ររបស់ Google។ អ្នកប្រើជ្រើស account និងអនុញ្ញាតសិទ្ធិដែលបានស្នើ។

ពាក្យសម្ងាត់ Google មិនត្រូវបានបញ្ជូនមកគេហទំព័រនេះទេ។ អ្នកប្រើបញ្ចូលពាក្យសម្ងាត់ជាមួយ Google ដោយផ្ទាល់។ បន្ទាប់ពីយល់ព្រម Google នឹងបញ្ជូន browser ត្រឡប់មក callback URL ជាមួយ code និង state។

4. Callback ពិនិត្យការត្រឡប់ពី Google

ក្នុង callback.ts server ពិនិត្យថា៖

- Google មិនបានត្រឡប់ error មកទេ។
មាន code និង state។
- state ដែល Google ត្រឡប់មក ត្រូវគ្នានឹងតម្លៃក្នុង cookie ដែល server បានរក្សាទុក។
- មាន verifier សម្រាប់ផ្គូផ្គងជាមួយ PKCE។

ការផ្គូផ្គង state ជួយការពារការបន្លំឱ្យ server ទទួលការឆ្លើយតប OAuth ដែលមិនមែនមកពី login ដែលអ្នកប្រើបានចាប់ផ្ដើម។ បើការពិនិត្យមិនជោគជ័យ កម្មវិធីលុប cookies បណ្ដោះអាសន្ន ហើយបញ្ជូនអ្នកប្រើត្រឡប់ទៅ login ជាមួយ error។

5. Server ដោះដូរ code ដើម្បីទទួល token

បើ callback ត្រឹមត្រូវ server ផ្ញើ code ទៅ Google ដើម្បីប្ដូរយក access token។ ការស្នើនេះប្រើ៖
```bash
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
redirect_uri
code_verifier
```
GOOGLE_CLIENT_SECRET ត្រូវនៅខាង server ប៉ុណ្ណោះ មិនគួរដាក់ក្នុងកូដ frontend ឬបញ្ជូនឱ្យ browser ទេ។ Google ពិនិត្យថា code និងព័ត៌មានសម្ងាត់ត្រឹមត្រូវ ហើយទើបផ្ដល់ token។ ក្នុងកូដនេះ បើមិនទទួលបាន access token នោះ login ត្រូវបរាជ័យ។

6. Server យក និងពិនិត្យ profile

កម្មវិធីប្រើ access token ស្នើ profile ពី Google។ វាត្រូវការយ៉ាងហោចណាស់៖
- sub៖ លេខសម្គាល់ Google account។
email៖ email។
- email_verified ត្រូវជា true។

បើ Google មិនបានបញ្ជាក់ email ឬខ្វះព័ត៌មានចាំបាច់ កម្មវិធីមិនបន្តទេ។

7. ពិនិត្យថា email មានសិទ្ធិចូលឬអត់

កម្មវិធីអាន GOOGLE_ALLOWED_EMAILS ហើយប្រៀបធៀប email ដែលបានបញ្ជាក់ជាមួយបញ្ជីនេះ។ ដូច្នេះ ការចូលដោយ Google បានជោគជ័យ មិនមានន័យថាអ្នកគ្រប់គ្នាអាចចូលគេហទំព័របានទេ—email ត្រូវមាននៅក្នុងបញ្ជីអនុញ្ញាត។

ឧទាហរណ៍៖
```
GOOGLE_ALLOWED_EMAILS=person@example.com,editor@example.com
```
បើ email មិនមានសិទ្ធិ កម្មវិធីបញ្ជូនត្រឡប់ទៅ login ហើយបង្ហាញសារ not_allowed។

8. រក្សាទុក ឬកែប្រែ user ក្នុង database

បន្ទាប់ពី email មានសិទ្ធិ កម្មវិធីប្រើ Prisma រក user តាម email៖

- បើមានរួច វាធ្វើបច្ចុប្បន្នភាពឈ្មោះបើ Google ផ្ដល់ឈ្មោះ។
- បើមិនទាន់មាន វាបង្កើត user ថ្មី។

តារាង User ស្ថិតក្នុង schema.prisma។ តាម callback បច្ចុប្បន្ន កម្មវិធីរក្សាទុក email និង name ប៉ុណ្ណោះ។ ទោះបី schema មាន fields googleId និង avatar ក៏ដោយ callback នេះមិនបានរក្សាទុក fields ទាំងនោះទេ។

9. បង្កើត session និងត្រឡប់ទៅគេហទំព័រ

មុខងារ createSession បង្កើតទិន្នន័យមាន userId និងពេលផុតកំណត់ 30 ថ្ងៃ។ វាចុះហត្ថលេខាលើទិន្នន័យនោះដោយ GOOGLE_CLIENT_SECRET ហើយរក្សាទុកក្នុង cookie ឈ្មោះ session។

Cookie ត្រូវបានកំណត់ជា៖

- HttpOnly៖ JavaScript នៅក្នុង browser មិនអាចអានតម្លៃ cookie បានដោយផ្ទាល់។
- Secure នៅ production៖ ផ្ញើតែតាម HTTPS។
- SameSite=Lax៖ ជួយកាត់បន្ថយការផ្ញើ cookie ពីសំណើ cross-site មួយចំនួន។
- ផុតកំណត់ក្រោយ 30 ថ្ងៃ។

បន្ទាប់មក callback បញ្ជូនអ្នកប្រើទៅ URL ដែលបានស្នើដំបូង ប្រសិនបើវាជា URL ក្នុងគេហទំព័រដដែល; បើមិនដូច្នោះទេ វាបញ្ជូនទៅ /dashboard។ ការត្រួតពិនិត្យនេះជួយកុំឱ្យ URL មិនទុកចិត្តបញ្ជូនអ្នកប្រើចេញទៅគេហទំព័រផ្សេង។

នៅពេល browser ស្នើទំព័របន្ទាប់ វាផ្ញើ session cookie មកវិញ។ getSessionUser() ពិនិត្យ signature និងថ្ងៃផុតកំណត់ រួចស្វែងរក user ក្នុង database។ ការធ្វើបែបនេះជួយឱ្យ server ដឹងថាអ្នកប្រើបានចូលរួច ដោយមិនចាំបាច់ឱ្យអ្នកប្រើចូល Google ម្ដងទៀតរាល់ទំព័រ។

ចំណាំ៖ ទោះ schema មានតារាង Session ក៏ដោយ flow ដែលអាននៅទីនេះមិនបង្កើត record ក្នុងតារាងនោះទេ។ វារក្សា session ជា signed cookie ដែលមាន userId និងថ្ងៃផុតកំណត់។

10. ចាកចេញ

ប៊ូតុងចាកចេញក្នុង login.astro ផ្ញើ POST ទៅ logout.ts។ Server លុប session cookie ហើយ browser ត្រឡប់ទៅ /login។ នេះលុប session របស់គេហទំព័រនេះ ប៉ុន្តែមិនចាំបាច់មានន័យថាអ្នកប្រើបាន sign out ពី Google account ទេ។

### ការកំណត់សំខាន់ៗ

ជាទូទៅត្រូវកំណត់៖

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_ALLOWED_EMAILS
- GOOGLE_REDIRECT_URI — អាចកំណត់ដោយផ្ទាល់ ឬប្រើតម្លៃលំនាំដើម 
- /api/auth/google/callback
- DATABASE_URL

អាសយដ្ឋាន redirect_uri ត្រូវតែត្រូវគ្នានឹង callback URL ដែលបានកំណត់ក្នុង Google OAuth settings។ បើខុសគ្នា login អាចបរាជ័យនៅដំណាក់កាល callback/token។

### Error ដែលអាចជួប

ទំព័រ login បង្ហាញសារតាម error ដែល callback ត្រឡប់មក៖

- not_allowed៖ email មិនមានក្នុងបញ្ជីអនុញ្ញាត។
- provider៖ Google បដិសេធ ឬអ្នកប្រើបោះបង់ការចូល។
- state៖ callback មិនមានទិន្នន័យត្រឹមត្រូវ ឬដំណើរការផុតកំណត់។
- token៖ ដោះដូរ code ជាមួយ Google មិនបាន—ពិនិត្យ credentials និង callback URL។
- profile៖ មិនអាចទាញ profile ឬ email ដែលបានបញ្ជាក់។
- database៖ រក្សាទុក user មិនបាន។
- session៖ បង្កើត session មិនបាន—ពិនិត្យ GOOGLE_CLIENT_ID និង GOOGLE_CLIENT_SECRET។

សរុបជាខ្សែដំណើរការ៖ Login page → server រៀបចំ OAuth → Google ផ្ទៀងផ្ទាត់អ្នកប្រើ → callback ពិនិត្យ code/state → server ទទួល profile → ពិនិត្យ email មានសិទ្ធិ → រក្សាទុក user → បង្កើត session cookie → ចូលប្រើទំព័រដែលត្រូវការ។

</details

