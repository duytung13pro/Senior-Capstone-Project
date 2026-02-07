'use client'
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";  
import LearningCarousel from "@/components/learning-carousel";
import { useLanguage } from "@/i18n/useLanguage"

export default function Home() {
  const { t, changeLanguage } = useLanguage()

  return (
    <div className="min-h-screen bg-[#FFF8E9]">
      {/* Header */}
      <header className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/logo02.svg"
            alt="Project Rewood"
            width={100}
            height={100}
            className="w-24 h-24 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => changeLanguage("vi")}>   🇻
          </Button>
          <Button size="sm" variant="ghost" onClick={() => changeLanguage("en")}>          🇺
          </Button>
          <Link href="/auth/login">
            <Button variant="outline" className="border-green-600 text-green-700">
              {t.nav.login}
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-green-600 hover:bg-green-700">
              {t.nav.register}
            </Button>
          </Link>
</div>

      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-green-800 leading-tight">
          {t.hero.title} <br />
          {t.hero.subtitle}
        </h1>

          <div className="flex flex-col space-y-4">
            <Button className="w-full md:w-64 h-12 text-base font-medium bg-green-600 hover:bg-green-700 shadow-md">
              {t.hero.freeTrial}
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-64 h-12 text-base font-medium border-2 border-amber-500 text-amber-600 bg-amber-50 hover:bg-amber-100 shadow-sm"
            >
              {t.hero.viewCourses}
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-64 h-12 text-base font-medium border-2 border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100 shadow-sm"
            >
              {t.hero.signUp}
            </Button>
          </div>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0">
          <Image
            src="/hero-section.png"
            alt="Learning Chinese"
            width={500}
            height={400}
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-orange-800 mb-6">
          {t.whyChoose.title}
        </h2>

        <p className="text-gray-700 mb-8 max-w-3xl">
          {t.whyChoose.description}
        </p>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-orange-500 rounded-lg p-6 text-white">
            <div className="mb-4">
              <Image
                src="/icon-computer.svg"
                alt="Online Learning"
                width={60}
                height={60}
                className="w-12 h-12"
              />
            </div>
            <h3>{t.features.onlineMaterials.title}</h3>
             <p>{t.features.onlineMaterials.desc}</p>
          </div>

          <div className="bg-green-600 rounded-lg p-6 text-white">
            <div className="mb-4">
              <Image
                src="/icon-notes.svg"
                alt="Curriculum"
                width={60}
                height={60}
                className="w-12 h-12"
              />
            </div>
            <h3>{t.features.clearPath.title}</h3>
              <p>{t.features.clearPath.desc}</p>
          </div>

          <div className="bg-amber-500 rounded-lg p-6 text-white">
            <div className="mb-4">
              <Image
                src="/icon-mobile.svg"
                alt="Mobile Learning"
                width={60}
                height={60}
                className="w-12 h-12"
              />
            </div>
            <h3>{t.features.multiPlatform.title}</h3>
              <p>{t.features.multiPlatform.desc}</p>
          </div>
        </div>
      </section>

      {/* Learning Journey Section */}
      <section className="container mx-auto px-4 py-12 overflow-hidden">
        <LearningCarousel />
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          {t.pricing.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-amber-500 text-white p-4 text-center font-bold">
              {t.pricing.free.name}
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-xl font-bold">{t.pricing.free.price}</p>
              </div>
              <p className="text-sm text-center text-gray-600">
                {t.pricing.free.description}
              </p>
              <div className="pt-4">
                <Button variant="outline" className="w-full border-gray-300">
                  {t.pricing.action}
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-amber-600 text-white p-4 text-center font-bold">
              {t.pricing.monthly.name}
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-xl font-bold">{t.pricing.monthly.price}</p>
              </div>
              <p className="text-sm text-center text-gray-600">
                {t.pricing.monthly.description}
              </p>
              <div className="pt-4">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  {t.pricing.action}
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-amber-700 text-white p-4 text-center font-bold">
              {t.pricing.yearly.name}
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-xl font-bold">{t.pricing.yearly.price}</p>
              </div>
              <p className="text-sm text-center text-gray-600">
                {t.pricing.yearly.description}
              </p>
              <div className="pt-4">
                <Button variant="outline" className="w-full border-gray-300">
                  {t.pricing.action}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/3">
            <Image
              src="/section-5.png"
              alt="Contact Us"
              width={300}
              height={300}
              className="w-full h-auto"
            />
          </div>
          <div className="md:w-2/3 space-y-6">
            <h2>
              {t.contact.title} <br />
              {t.contact.subtitle}
            </h2>
            <p>{t.contact.description}</p>


            <form className="space-y-4">
              <Input placeholder={t.contact.form.name} className="bg-white" />
              <Input placeholder={t.contact.form.email} className="bg-white" />
              <Input
                placeholder={t.contact.form.phone}
                className="bg-white"
              />
              <Textarea
                placeholder={t.contact.form.mesage}
                className="bg-white"
              />
              <Button className="w-full md:w-auto bg-orange-500 hover:bg-orange-600">
                {t.contact.form.submit}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Image
              src="/logo02.svg"
              alt="Project Rewood"
              width={100}
              height={100}
              className="w-24 h-24 cursor-pointer"
            />
            <div>
              <p className="text-xs text-gray-500">
                {t.footer.copyright}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="https://www.facebook.com/" className="text-blue-600">
              <Image
                src="/icon-facebook.svg"
                alt="Facebook"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </Link>
            <Link href="https://www.instagram.com/" className="text-pink-600">
              <Image
                src="/icon-instagram.svg"
                alt="Instagram"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </Link>
            <Link href="https://github.com/" className="text-gray-800">
              <Image
                src="/icon-github.svg"
                alt="GitHub"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}