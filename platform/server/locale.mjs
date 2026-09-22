export const localeOf=account=>account?.preferences?.locale==='lv'?'lv':'en';
export const localized=(account,en,lv)=>localeOf(account)==='lv'?lv:en;
const errors={
 'Sign in to continue.':'Ienāc kontā, lai turpinātu.',
 'This action is not available.':'Šī darbība nav pieejama.',
 'This request method is not allowed.':'Šī pieprasījuma metode nav atļauta.',
 'The request is too large.':'Pieprasījums ir pārāk liels.',
 'Provide a valid request.':'Iesniedz derīgu pieprasījumu.',
 'The request could not be read.':'Pieprasījumu neizdevās nolasīt.',
 'Something went wrong. Try again or contact support.':'Radās kļūda. Mēģini vēlreiz vai sazinies ar atbalstu.',
 'Email or password is incorrect.':'E-pasts vai parole nav pareiza.',
 'Verify your email before signing in.':'Pirms ienākšanas apstiprini savu e-pastu.',
 'Too many attempts. Please wait.':'Pārāk daudz mēģinājumu. Lūdzu, uzgaidi.',
 'This link is invalid or expired. Request a new one.':'Saite nav derīga vai tās termiņš ir beidzies. Pieprasi jaunu saiti.',
 'This event is closed.':'Šis pasākums ir slēgts.',
 'Photo unavailable.':'Foto nav pieejams.',
 'Some selected photos are unavailable.':'Daži izvēlētie foto nav pieejami.',
 'This photo is too large.':'Foto ir pārāk liels.',
 'Choose a paid plan.':'Izvēlies maksas plānu.',
 'Administrator access is required.':'Nepieciešamas administratora tiesības.'
};
export const requestLocale=req=>(req.headers.get('accept-language')||'').toLowerCase().startsWith('lv')?'lv':'en';
export const translateError=(message,locale)=>locale==='lv'?(errors[message]||message):message;
