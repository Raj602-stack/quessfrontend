import { useState } from "react";

const BIO = [
  <>
    Hey I'm Amartya (Raj). I'm a <strong>full-stack engineer</strong> who gets excited about <strong>hard problems</strong> and the process of solving them well.
  </>,
  <>
    I've worked through <strong>300+ LeetCode problems</strong>, not just to prep for interviews, but because I love the way it trains your brain to think clearly and structurally. That mindset shows up in everything I build <strong>scalable backends, clean frontends, production deployments</strong>, the whole loop.
  </>,
  <>
    I've worked in big companies like <strong>Ashok Leyland</strong> and <strong>early-stage startups</strong> where I <strong>built products from zero</strong>. I love that mix, one taught me <strong>scale and rigor</strong>, the other taught me <strong>speed and ownership</strong>.
  </>,
  <>
    For me, <strong>engineering</strong> isn't just about writing code. It's about turning <strong>messy ideas into solid systems</strong>, and <strong>solid systems into things people can actually rely on</strong>.
  </>,
];

export default function AboutMe() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bookmark tab on the right edge */}
      <button
        type="button"
        className="about-bookmark"
        onClick={() => setOpen(true)}
        aria-label="About me"
      >
        <span className="about-bookmark__fold" />
        <span className="about-bookmark__text">About Me</span>
      </button>

      {/* Popup overlay */}
      {open && (
        <div
          className="about-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
        >
          <div
            className="about-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="about-popup__close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 id="about-title" className="about-popup__title">
              About Me
            </h2>
            <div className="about-popup__content">
              {BIO.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <p className="about-popup__sign">~ Amartya (Raj)</p>
          </div>
        </div>
      )}
    </>
  );
}
