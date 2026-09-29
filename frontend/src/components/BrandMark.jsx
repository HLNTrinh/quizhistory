export default function BrandMark({ small = false }) {
  return (
    <div className="flex items-center gap-2.5 group cursor-pointer">
      <img
        alt="Logo Sử Việt Ký"
        className={`${small ? "w-8 h-8" : "w-10 h-10"} object-contain drop-shadow-sm group-hover:rotate-6 transition-transform duration-300`}
        src="https://lh3.googleusercontent.com/aida/AEtjO1VDcuI2k4Pzv66ZvKO4uZ6VcKmCvkRc0GcqqdYVPA5u2lxLq7RUuziyVSurFbBv-xRR9jgBdJvwKTFnGIVitaxhenvC7iIZk7T3sb2Gv-oeLsjktQe4VJS_v3MLTnX99dsrXrGYzSfuRPXwFaiirrp-K_AXJLptDKEkgrnbrqgnDq5-0bD-wuIgkrrxvIMe2Hg1IxjELciVKfZKO_OphlVqafEmjdBmOQpyibW7D53bc-PtRw0ZptadaQ"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="flex flex-col">
        <span className={`${small ? "text-lg" : "text-xl"} font-extrabold text-primary tracking-tight`}>
          Sử Việt Ký
        </span>
        <span className="text-[10px] text-secondary uppercase tracking-widest font-extrabold -mt-1">
          History Quest
        </span>
      </div>
    </div>
  );
}