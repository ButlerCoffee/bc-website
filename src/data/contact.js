// Butler Coffee phone number, shown in the footer and the "Let's talk." sections
export const PHONE = '+34 672 866 924'
export const telHref = (phone = PHONE) => `tel:${phone.replace(/\s/g, '')}`
