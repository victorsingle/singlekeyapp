export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateCPF(cpf: string): boolean {
  const strCPF = cpf.replace(/[^\d]/g, '');
  
  if (strCPF.length !== 11) return false;
  
  if (/^(\d)\1{10}$/.test(strCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(10, 11))) return false;
  
  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const strCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (strCNPJ.length !== 14) return false;
  
  if (/^(\d)\1{13}$/.test(strCNPJ)) return false;
  
  let size = strCNPJ.length - 2;
  let numbers = strCNPJ.substring(0, size);
  const digits = strCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = strCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

export function validatePhone(phone: string): boolean {
  const phoneNumber = phone.replace(/\D/g, '');
  return phoneNumber.length >= 10 && phoneNumber.length <= 11;
}