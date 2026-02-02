export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  // Accepts formats: +1234567890, 123-456-7890, (123) 456-7890, 1234567890, etc.
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone) && /\d{10,}/.test(phone.replace(/\D/g, ''));
}

export function isValidAddress(address: string): boolean {
  // Address must be at least 5 characters and contain alphanumeric characters
  return Boolean(address) && address.trim().length >= 5 && /[a-zA-Z0-9]/.test(address);
}

export function sanitizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.trim();
}

export function validateOrderInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("At least one item is required");
  }

  if (data.customer) {
    if (data.customer.trim().length < 2) {
      errors.push("Customer name must be at least 2 characters");
    }
  }

  if (data.email) {
    if (!isValidEmail(data.email)) {
      errors.push("Invalid email format");
    }
  }

  if (data.contactNumber) {
    if (!isValidPhoneNumber(data.contactNumber)) {
      errors.push("Invalid phone number format");
    }
  }

  if (data.address) {
    if (!isValidAddress(data.address)) {
      errors.push("Address must be at least 5 characters");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateFoodItem(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
    errors.push("Price must be a positive number");
  }

  if (data.category && data.category.trim().length < 1) {
    errors.push("Category must not be empty");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
