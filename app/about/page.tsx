import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-3xl mx-auto py-12 px-6 md:px-8 pb-32">
        <Link 
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Kembali ke Chat</span>
        </Link>
        
        <article className="prose prose-zinc prose-lg max-w-none">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-900 mb-8">
            Tentang Yun-Zhi
          </h1>
          
          <div className="flex items-center gap-4 mb-10 not-prose">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              FA
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-900">M Fariz Alfauzi</h3>
              <p className="text-zinc-500">CEO & Lead Developer</p>
            </div>
          </div>

          <p className="lead text-xl text-zinc-600">
            Halo! Saya M Fariz Alfauzi, pemuda berusia 17 tahun kelahiran Cianjur, Jawa Barat. Saat ini saya sedang menempuh pendidikan di <strong>SMK NURUL ISLAM AFFANDIYAH</strong> mengambil jurusan Teknik Komputer.
          </p>

          <h2>Visi & Misi</h2>
          <p>
            <strong>Visi:</strong> Menghadirkan teknologi kecerdasan buatan yang mudah diakses, responsif, dan memiliki antarmuka yang ramah bagi semua kalangan di Indonesia dan dunia.
          </p>
          <p>
            <strong>Misi:</strong> Mengembangkan aplikasi dengan standar industri modern, mengutamakan kenyamanan pengguna (UX), dan terus berinovasi dalam dunia rekayasa perangkat lunak meskipun masih di usia muda.
          </p>

          <h2>Di Balik Layar (Teknologi)</h2>
          <p>
            Proyek Yun-Zhi ini dibangun dari nol dengan semangat untuk belajar dan menciptakan produk berkualitas tinggi. Berikut adalah teknologi utama yang menggerakkan aplikasi ini:
          </p>
          <ul>
            <li><strong>Next.js 15:</strong> Framework React modern untuk performa rendering yang sangat cepat.</li>
            <li><strong>Tailwind CSS 4:</strong> Digunakan untuk meracik desain antarmuka yang minimalis, bersih, dan responsif di berbagai ukuran layar.</li>
            <li><strong>Google Gemini API:</strong> Otak kecerdasan buatan di balik Yun-Zhi yang memberikan respon cerdas dan natural.</li>
            <li><strong>Framer Motion:</strong> Memberikan sentuhan animasi yang halus agar aplikasi terasa lebih hidup dan premium.</li>
          </ul>

          <hr className="my-10 border-zinc-200" />
          
          <p className="text-sm text-zinc-500 text-center">
            Dibuat dengan ❤️ oleh M Fariz Alfauzi © {new Date().getFullYear()}
          </p>
        </article>
      </div>
    </div>
  );
}
