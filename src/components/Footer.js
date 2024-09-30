import Link from "next/link";
import { FaFacebook, FaYoutube, FaInstagram, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white text-white text-center py-8">
      {/* View Cart */}
      <div className="mb-4">
        <Link href="/cart" className="text-lg font-bold">
          View Your Cart
        </Link>
      </div>

      {/* Copyright */}
      <div className="mb-4">© 2024 Your Shop Name. All rights reserved.</div>

      {/* Links */}
      <div className="mb-4 space-x-4">
        <Link href="/privacy-policy">Privacy Policy</Link>
        <span>|</span>
        <Link href="/copyright-statement">Copyright Statement</Link>
        <span>|</span>
        <Link href="/cookies-policy">Cookies</Link>
      </div>

      {/* Social Icons */}
      <div className="flex justify-center space-x-6 mt-4">
        <Link href="https://facebook.com" target="_blank">
          <FaFacebook className="text-xl" />
        </Link>
        <Link href="https://youtube.com" target="_blank">
          <FaYoutube className="text-xl" />
        </Link>
        <Link href="mailto:your-email@example.com">
          <FaEnvelope className="text-xl" />
        </Link>
        <Link href="https://instagram.com" target="_blank">
          <FaInstagram className="text-xl" />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
