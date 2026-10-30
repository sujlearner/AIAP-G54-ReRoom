import { Sofa } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';

const STYLE_TEASER = ['Modern', 'Traditional', 'Boho', 'Mediterranean'];

const BEFORE_IMAGE = 'https://images.pexels.com/photos/8031903/pexels-photo-8031903.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const AFTER_IMAGE = 'https://images.pexels.com/photos/20653874/pexels-photo-20653874.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-6">
        <Sofa className="h-6 w-6 text-forest-600" />
        <span className="font-display text-xl font-semibold tracking-tight">ReRoom</span>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-4 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-12">
        <section className="space-y-8">
          <div className="space-y-5">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-forest-600">Living room makeovers</p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
              See your living room in a new style before you spend a cent
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Upload a photo of your room, choose a style, and get a makeover of that same room. Compare it with the
              original and keep the looks you love.
            </p>
          </div>

          <ul className="flex flex-wrap gap-2">
            {STYLE_TEASER.map((style) => (
              <li
                key={style}
                className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-ink"
              >
                {style}
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <BeforeAfterSlider
              beforeSrc={BEFORE_IMAGE}
              afterSrc={AFTER_IMAGE}
              beforeAlt="Bright living room before restyling"
              afterAlt="Living room after a styled makeover"
            />
            <p className="text-sm text-muted">Drag the divider to compare.</p>
          </div>
        </section>

        <section className="w-full max-w-md lg:ml-auto">
          <AuthForm />
        </section>
      </main>
    </div>
  );
}
