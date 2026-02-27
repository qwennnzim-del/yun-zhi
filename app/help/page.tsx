'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Shield, Lock, Database, UserCheck, MessageSquare, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function HelpContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'faq';
  const [activeTab, setActiveTab] = useState<'faq' | 'privacy'>(initialTab);

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 font-sans">
      <div className="max-w-4xl mx-auto py-12 px-6 md:px-8 pb-32">
        <Link 
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Kembali ke Chat</span>
        </Link>
        
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-900 mb-4">
            Bantuan & Privasi
          </h1>
          <p className="text-lg text-zinc-500">
            Temukan jawaban untuk pertanyaan Anda dan pelajari bagaimana kami menjaga keamanan data Anda.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-zinc-200/50 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'faq' 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
            }`}
          >
            <BookOpen size={18} className={activeTab === 'faq' ? 'text-indigo-500' : ''} />
            Pusat Bantuan
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'privacy' 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
            }`}
          >
            <Shield size={18} className={activeTab === 'privacy' ? 'text-emerald-500' : ''} />
            Privasi & Keamanan
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-8 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'faq' ? (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="text-2xl font-semibold text-zinc-900">Pusat Bantuan</h2>
                </div>

                <div className="grid gap-6">
                  {/* FAQ Item 1 */}
                  <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <h3 className="text-lg font-medium text-zinc-900 mb-2 flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-500" />
                      Apa itu Yun-Zhi?
                    </h3>
                    <p className="text-zinc-600 leading-relaxed">
                      Yun-Zhi adalah asisten kecerdasan buatan (AI) canggih yang dikembangkan oleh Zent Technology Inc. Yun-Zhi dirancang untuk membantu Anda menjawab pertanyaan, menganalisis gambar, menulis kode, dan menjadi teman diskusi yang cerdas.
                    </p>
                  </div>

                  {/* FAQ Item 2 */}
                  <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <h3 className="text-lg font-medium text-zinc-900 mb-2 flex items-center gap-2">
                      <UserCheck size={18} className="text-indigo-500" />
                      Bagaimana cara Login?
                    </h3>
                    <p className="text-zinc-600 leading-relaxed">
                      Saat ini, Yun-Zhi dapat digunakan secara langsung tanpa perlu membuat akun (mode anonim). Riwayat obrolan Anda disimpan secara aman dan dihubungkan dengan sesi browser Anda saat ini. Fitur login menggunakan akun Google atau Email sedang dalam tahap pengembangan untuk sinkronisasi antar perangkat.
                    </p>
                  </div>

                  {/* FAQ Item 3 */}
                  <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <h3 className="text-lg font-medium text-zinc-900 mb-2 flex items-center gap-2">
                      <ImageIcon size={18} className="text-indigo-500" />
                      Cara menggunakan fitur analisis gambar?
                    </h3>
                    <p className="text-zinc-600 leading-relaxed">
                      Sangat mudah! Klik tombol <strong>Plus (+)</strong> di sebelah kiri kolom pengetikan pesan, lalu pilih gambar dari perangkat Anda. Setelah gambar muncul di atas kolom input, Anda bisa menambahkan pertanyaan tentang gambar tersebut, lalu klik tombol <strong>Kirim</strong>.
                    </p>
                  </div>

                  {/* FAQ Item 4 */}
                  <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <h3 className="text-lg font-medium text-zinc-900 mb-2 flex items-center gap-2">
                      <MessageSquare size={18} className="text-indigo-500" />
                      Bagaimana cara mencari riwayat obrolan?
                    </h3>
                    <p className="text-zinc-600 leading-relaxed">
                      Buka menu sidebar di sebelah kiri (klik ikon garis tiga jika Anda menggunakan HP). Di bagian atas daftar &quot;Terbaru&quot;, terdapat kolom pencarian. Ketikkan kata kunci atau judul obrolan yang ingin Anda cari, dan daftar riwayat akan otomatis tersaring.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Shield size={20} />
                  </div>
                  <h2 className="text-2xl font-semibold text-zinc-900">Privasi & Keamanan</h2>
                </div>

                <div className="prose prose-zinc max-w-none">
                  <p className="text-lg text-zinc-600 mb-8">
                    Di Zent Technology Inc., kami sangat menghargai privasi Anda. Kami menerapkan standar keamanan industri untuk memastikan data percakapan Anda tetap aman dan rahasia.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 not-prose">
                    {/* Privacy Item 1 */}
                    <div className="p-6 rounded-2xl border border-zinc-200">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                        <Database size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2">Penyimpanan Data Aman</h3>
                      <p className="text-zinc-600 text-sm leading-relaxed">
                        Seluruh riwayat obrolan dan gambar yang Anda unggah disimpan menggunakan infrastruktur <strong>Google Firebase Firestore</strong>. Database ini dilindungi oleh aturan keamanan ketat yang mencegah akses tidak sah.
                      </p>
                    </div>

                    {/* Privacy Item 2 */}
                    <div className="p-6 rounded-2xl border border-zinc-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                        <Lock size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2">Enkripsi End-to-End</h3>
                      <p className="text-zinc-600 text-sm leading-relaxed">
                        Semua komunikasi antara perangkat Anda, server kami, dan API AI dienkripsi sepenuhnya menggunakan protokol <strong>HTTPS/TLS</strong>. Tidak ada pihak ketiga yang dapat menyadap percakapan Anda di tengah jalan.
                      </p>
                    </div>

                    {/* Privacy Item 3 */}
                    <div className="p-6 rounded-2xl border border-zinc-200">
                      <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                        <Shield size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2">Tidak Dijual ke Pihak Ketiga</h3>
                      <p className="text-zinc-600 text-sm leading-relaxed">
                        Data percakapan Anda adalah milik Anda. Kami <strong>tidak pernah</strong> menjual, menyewakan, atau membagikan data pribadi maupun isi obrolan Anda kepada perusahaan iklan atau pihak ketiga manapun.
                      </p>
                    </div>

                    {/* Privacy Item 4 */}
                    <div className="p-6 rounded-2xl border border-zinc-200">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                        <UserCheck size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2">Kendali Penuh Pengguna</h3>
                      <p className="text-zinc-600 text-sm leading-relaxed">
                        Anda memiliki kendali penuh atas data Anda. Meskipun saat ini fitur hapus riwayat sedang dalam pengembangan UI, secara sistem data Anda terisolasi per sesi dan tidak akan diakses oleh pengguna lain.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500 font-medium">
            ©2026 Zent Technology Inc.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-zinc-200 rounded-full"></div>
          <div className="h-4 w-32 bg-zinc-200 rounded"></div>
        </div>
      </div>
    }>
      <HelpContent />
    </Suspense>
  );
}
