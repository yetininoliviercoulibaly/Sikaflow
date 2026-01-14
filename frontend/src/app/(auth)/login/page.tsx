
import { LoginForm } from '@/features/auth/components/LoginForm';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <LoginForm />
    </main>
  );
}
