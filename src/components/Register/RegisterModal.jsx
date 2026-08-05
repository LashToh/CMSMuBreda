import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { FaTimes, FaUserPlus } from 'react-icons/fa';

import { useRegister } from '../../context/RegisterContext';

import { useTranslation } from '../../context/LanguageContext';

import { registerAccount, ApiError } from '../../services/api';

import './RegisterModal.scss';



const INITIAL_FORM = {
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
};

function resolveRegisterMessage(error, t) {
  if (error instanceof ApiError && error.code) {
    const key = `register.errors.${error.code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return error.message || t('register.errors.generic');
}



export default function RegisterModal() {

  const { isOpen, closeRegister } = useRegister();

  const { t } = useTranslation();

  const [form, setForm] = useState(INITIAL_FORM);

  const [status, setStatus] = useState('idle');

  const [message, setMessage] = useState('');



  useEffect(() => {

    if (!isOpen) return undefined;



    const onKeyDown = (event) => {

      if (event.key === 'Escape') closeRegister();

    };



    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKeyDown);



    return () => {

      document.body.style.overflow = '';

      window.removeEventListener('keydown', onKeyDown);

    };

  }, [isOpen, closeRegister]);



  useEffect(() => {

    if (!isOpen) {

      setForm(INITIAL_FORM);

      setStatus('idle');

      setMessage('');

    }

  }, [isOpen]);



  const handleChange = (event) => {

    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (status !== 'idle') {

      setStatus('idle');

      setMessage('');

    }

  };



  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setStatus('error');
      setMessage(t('register.errors.PASSWORD_MISMATCH'));
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      await registerAccount(form);
      setStatus('success');
      setMessage(t('register.success'));
      setForm(INITIAL_FORM);
    } catch (error) {
      setStatus('error');
      setMessage(resolveRegisterMessage(error, t));
    }
  };



  return (

    <AnimatePresence>

      {isOpen && (

        <motion.div

          className="register-modal"

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          exit={{ opacity: 0 }}

          onClick={closeRegister}

          role="presentation"

        >

          <motion.div

            className="register-modal__panel glass-card"

            initial={{ opacity: 0, y: 40, scale: 0.96 }}

            animate={{ opacity: 1, y: 0, scale: 1 }}

            exit={{ opacity: 0, y: 24, scale: 0.98 }}

            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}

            onClick={(event) => event.stopPropagation()}

            role="dialog"

            aria-modal="true"

            aria-labelledby="register-title"

          >

            <button

              type="button"

              className="register-modal__close"

              onClick={closeRegister}

              aria-label={t('register.close')}

            >

              <FaTimes />

            </button>



            <span className="section-label">{t('register.sectionLabel')}</span>

            <h2 id="register-title" className="register-modal__title">

              {t('register.title')}

            </h2>

            <div className="divider" />



            <p className="register-modal__intro">{t('register.intro')}</p>



            <form className="register-modal__form" onSubmit={handleSubmit}>

              <label className="register-modal__field">

                <span>{t('register.username')}</span>

                <input

                  type="text"

                  name="username"

                  value={form.username}

                  onChange={handleChange}

                  autoComplete="username"

                  minLength={4}

                  maxLength={10}

                  pattern="[A-Za-z0-9]{4,10}"

                  required

                  disabled={status === 'loading'}

                  placeholder={t('register.usernamePlaceholder')}

                />

              </label>



              <label className="register-modal__field">

                <span>{t('register.password')}</span>

                <input

                  type="password"

                  name="password"

                  value={form.password}

                  onChange={handleChange}

                  autoComplete="new-password"

                  minLength={4}

                  maxLength={20}

                  required

                  disabled={status === 'loading'}

                  placeholder={t('register.passwordPlaceholder')}

                />

              </label>



              <label className="register-modal__field">

                <span>{t('register.confirmPassword')}</span>

                <input

                  type="password"

                  name="confirmPassword"

                  value={form.confirmPassword}

                  onChange={handleChange}

                  autoComplete="new-password"

                  minLength={4}

                  maxLength={20}

                  required

                  disabled={status === 'loading'}

                />

              </label>



              <label className="register-modal__field">

                <span>{t('register.email')}</span>

                <input

                  type="email"

                  name="email"

                  value={form.email}

                  onChange={handleChange}

                  autoComplete="email"

                  maxLength={50}

                  required

                  disabled={status === 'loading'}

                  placeholder={t('register.emailPlaceholder')}

                />

              </label>



              {message && (

                <p

                  className={`register-modal__message register-modal__message--${status}`}

                  role="alert"

                >

                  {message}

                </p>

              )}



              <button

                type="submit"

                className="btn btn--primary btn--large register-modal__submit"

                disabled={status === 'loading'}

              >

                <FaUserPlus />

                {status === 'loading' ? t('register.submitting') : t('register.submit')}

              </button>

            </form>

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>

  );

}

