import styles from "../styles/components/LoadingMask.module.css";

export interface ILoadingMaskProps {
  className?: string;
  text?: string;
}

export function LoadingMask({
  className,
  text = "Carregando...",
}: ILoadingMaskProps) {
  return (
    <div
      className={`${styles.container} ${className}`}
      id="loading-mask-container"
    >
      <svg width="180" height="180">
        <circle
          className={styles.circle}
          fill="none"
          stroke="white"
          strokeWidth="3"
          cx="93"
          cy="93"
          r="84"
        />

        <circle
          className={styles.circleInter}
          fill="none"
          stroke="white"
          strokeWidth="3"
          cx="93"
          cy="86"
          r="78"
        />
      </svg>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
