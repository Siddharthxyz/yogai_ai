import { Sparkles, Heart, Globe, Mail } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12 px-6 lg:px-12 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 group cursor-default">
          <Sparkles className="text-primary-600" size={20} />
          <span className="text-lg font-black tracking-tighter text-gray-900 dark:text-white uppercase">
            YogAI
          </span>
        </div>
        
        <div className="flex gap-8">
          <SocialLink icon={Globe} />
          <SocialLink icon={Mail} />
          <SocialLink icon={Heart} />
        </div>

        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          © 2026 Neural Wellness Ecosystem
        </p>
      </div>
    </footer>
  );
}

function SocialLink({ icon: Icon }) {
  return (
    <a href="#" className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
      <Icon size={20} />
    </a>
  );
}

export default Footer;
