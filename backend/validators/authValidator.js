import { ValidationError } from "../utils/errors.js";

export class AuthValidator {
  /**
   * Validează datele pentru înregistrare
   */
  static validateSignupData(userData) {
    const {
      email,
      password,
      phone,
      firstName,
      lastName,
      userType,
      companyDetails
    } = userData;

    const errors = [];

    // Validare email
    if (!email) {
      errors.push("Email-ul este obligatoriu.");
    } else if (!this.isValidEmail(email)) {
      errors.push("Adresa de email este invalidă.");
    } else if (email.length > 254) {
      errors.push("Email-ul este prea lung.");
    }

    // Validare parolă
    if (!password) {
      errors.push("Parola este obligatorie.");
    } else if (!this.isValidPassword(password)) {
      errors.push("Parola trebuie să aibă cel puțin 8 caractere, să conțină o literă mare, o literă mică, o cifră și un caracter special.");
    }

    // Validare tip utilizator
    if (!userType) {
      errors.push("Tipul de utilizator este obligatoriu.");
    } else if (!["persoana_fizica", "persoana_juridica"].includes(userType)) {
      errors.push("Tipul de utilizator este invalid.");
    }

    // Validare telefon (opțional, dar dacă există trebuie să fie valid)
    if (phone && !this.isValidPhoneNumber(phone)) {
      errors.push("Numărul de telefon este invalid. Format acceptat: +40... sau 07...");
    }

    // Validări specifice pentru persoana fizică
    if (userType === "persoana_fizica") {
      if (!firstName?.trim()) {
        errors.push("Prenumele este obligatoriu pentru persoanele fizice.");
      } else if (firstName.trim().length < 2) {
        errors.push("Prenumele trebuie să aibă cel puțin 2 caractere.");
      } else if (firstName.trim().length > 50) {
        errors.push("Prenumele este prea lung.");
      }

      if (!lastName?.trim()) {
        errors.push("Numele este obligatoriu pentru persoanele fizice.");
      } else if (lastName.trim().length < 2) {
        errors.push("Numele trebuie să aibă cel puțin 2 caractere.");
      } else if (lastName.trim().length > 50) {
        errors.push("Numele este prea lung.");
      }
    }

    // Validări pentru persoana juridică
    if (userType === "persoana_juridica") {
      if (!companyDetails) {
        errors.push("Detaliile companiei sunt obligatorii pentru persoanele juridice.");
      } else {
        if (!companyDetails.companyName?.trim()) {
          errors.push("Numele companiei este obligatoriu.");
        } else if (companyDetails.companyName.trim().length < 2) {
          errors.push("Numele companiei trebuie să aibă cel puțin 2 caractere.");
        } else if (companyDetails.companyName.trim().length > 100) {
          errors.push("Numele companiei este prea lung.");
        }

        if (!companyDetails.cui?.trim()) {
          errors.push("CUI-ul este obligatoriu.");
        } else if (!this.isValidCUI(companyDetails.cui.trim())) {
          errors.push("CUI-ul nu are un format valid.");
        }

        if (!companyDetails.nrRegCom?.trim()) {
          errors.push("Numărul de înregistrare la Registrul Comerțului este obligatoriu.");
        } else if (!this.isValidRegCom(companyDetails.nrRegCom.trim())) {
          errors.push("Numărul de înregistrare la Registrul Comerțului nu are un format valid.");
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează datele pentru autentificare
   */
  static validateSigninData(credentials) {
    const { email, password } = credentials;
    const errors = [];

    if (!email) {
      errors.push("Email-ul este obligatoriu.");
    } else if (!this.isValidEmail(email)) {
      errors.push("Adresa de email este invalidă.");
    }

    if (!password) {
      errors.push("Parola este obligatorie.");
    } else if (password.length < 1) {
      errors.push("Parola nu poate fi goală.");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează token-ul de refresh
   */
  static validateRefreshToken(token) {
    if (!token) {
      throw new ValidationError("Refresh token-ul este obligatoriu.");
    }

    if (typeof token !== 'string') {
      throw new ValidationError("Refresh token-ul trebuie să fie un string.");
    }

    if (token.length < 10) {
      throw new ValidationError("Refresh token-ul pare să fie invalid.");
    }
  }

  /**
   * Validează email-ul pentru resetare parolă
   */
  static validatePasswordResetEmail(email) {
    if (!email) {
      throw new ValidationError("Email-ul este obligatoriu.");
    }

    if (!this.isValidEmail(email)) {
      throw new ValidationError("Adresa de email este invalidă.");
    }
  }

  /**
   * Validează datele pentru resetarea parolei
   */
  static validatePasswordReset(data) {
    const { token, newPassword } = data;
    const errors = [];

    if (!token) {
      errors.push("Token-ul de resetare este obligatoriu.");
    } else if (typeof token !== 'string') {
      errors.push("Token-ul de resetare trebuie să fie un string.");
    }

    if (!newPassword) {
      errors.push("Noua parolă este obligatorie.");
    } else if (!this.isValidPassword(newPassword)) {
      errors.push("Noua parolă trebuie să aibă cel puțin 8 caractere, să conțină o literă mare, o literă mică, o cifră și un caracter special.");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează schimbarea parolei
   */
  static validatePasswordChange(data) {
    const { currentPassword, newPassword, confirmPassword } = data;
    const errors = [];

    if (!currentPassword) {
      errors.push("Parola curentă este obligatorie.");
    }

    if (!newPassword) {
      errors.push("Noua parolă este obligatorie.");
    } else if (!this.isValidPassword(newPassword)) {
      errors.push("Noua parolă trebuie să aibă cel puțin 8 caractere, să conțină o literă mare, o literă mică, o cifră și un caracter special.");
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      errors.push("Confirmarea parolei nu se potrivește cu noua parolă.");
    }

    if (currentPassword === newPassword) {
      errors.push("Noua parolă trebuie să fie diferită de cea curentă.");
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "));
    }
  }

  /**
   * Validează formatul email-ului
   */
  static isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email.trim().toLowerCase());
  }

  /**
   * Validează complexitatea parolei
   */
  static isValidPassword(password) {
    // Cel puțin 8 caractere, o literă mare, o literă mică, o cifră și un caracter special
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Validează numărul de telefon românesc
   */
  static isValidPhoneNumber(phone) {
    const cleanPhone = phone.replace(/\s+/g, '');
    // Format acceptat: +40xxxxxxxxx sau 07xxxxxxxx sau 02xxxxxxxx
    const phoneRegex = /^(\+4|0)[0-9]{9}$/;
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Validează formatul CUI-ului românesc
   */
  static isValidCUI(cui) {
    const cleanCUI = cui.replace(/\s+/g, '').toUpperCase();
    // Format: RO123456789 sau 123456789
    const cuiRegex = /^(RO)?[0-9]{2,10}$/;
    return cuiRegex.test(cleanCUI);
  }

  /**
   * Validează formatul numărului de înregistrare la Registrul Comerțului
   */
  static isValidRegCom(nrRegCom) {
    const cleanRegCom = nrRegCom.replace(/\s+/g, '').toUpperCase();
    // Format: J40/1234/2020 sau F40/1234/2020
    const regComRegex = /^[JF]\d{2}\/\d+\/\d{4}$/;
    return regComRegex.test(cleanRegCom);
  }

  /**
   * Sanitizează stringurile de input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove basic HTML chars
      .slice(0, 255); // Limit length
  }

  /**
   * Validează și sanitizează toate datele de input
   */
  static sanitizeSignupData(userData) {
    return {
      email: this.sanitizeInput(userData.email)?.toLowerCase(),
      password: userData.password, // Nu sanitizăm parola
      phone: this.sanitizeInput(userData.phone),
      firstName: this.sanitizeInput(userData.firstName),
      lastName: this.sanitizeInput(userData.lastName),
      userType: userData.userType,
      companyDetails: userData.companyDetails ? {
        companyName: this.sanitizeInput(userData.companyDetails.companyName),
        cui: this.sanitizeInput(userData.companyDetails.cui)?.toUpperCase(),
        nrRegCom: this.sanitizeInput(userData.companyDetails.nrRegCom)?.toUpperCase()
      } : undefined
    };
  }

  /**
   * Verifică limitele de rate limiting (poate fi folosit în middleware)
   */
  static validateRateLimit(attempts, maxAttempts = 5, timeWindow = 900000) {
    if (attempts >= maxAttempts) {
      throw new ValidationError(`Prea multe încercări. Încercați din nou în ${Math.ceil(timeWindow / 60000)} minute.`);
    }
  }
}