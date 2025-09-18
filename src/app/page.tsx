import Image from "next/image";
import { CachedImage } from "@/components/elements/image-cache";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { getPosts } from "@/lib/db/queries";

export default function Home() {
  return (
    <main>
      <PageContent />
    </main>
  );
}

const PostList = async () => {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
      <h4>Posts</h4>
      <ul className="">
        {posts.map((post) => (
          <li key={post.id}>
            <h6>{post.title}</h6>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PageContent = () => {
  return (
    <>
      <div className="pb-6 sm:pb-8 lg:pb-12">
        <section className="mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="mb-8 flex flex-wrap justify-between md:mb-16">
            <div className="mb-6 flex w-full flex-col justify-center sm:mb-12 lg:mb-0 lg:w-1/3 lg:pt-48 lg:pb-24">
              <h2 className="mb-4">
                Find your
                <br />
                style online
              </h2>

              <p className="max-w-md text-md">
                This is a section of some simple filler text, also known as
                placeholder text. It shares characteristics of real text.
              </p>
            </div>

            <div className="mb-12 flex w-full md:mb-16 lg:w-2/3">
              <div className="-ml-12 relative top-12 left-12 z-10 overflow-hidden rounded-lg shadow-lg md:top-16 md:left-16 lg:ml-0">
                <CachedImage
                  alt="Photo by Kaung Htet"
                  className="h-full w-full object-cover object-center"
                  height={550}
                  priority="eager"
                  src="https://images.unsplash.com/photo-1542340916-951bb72c8f74?auto=format&q=75&fit=crop&w=550&h=550"
                  width={550}
                />
              </div>

              <div className="overflow-hidden rounded-lg shadow-lg">
                <CachedImage
                  alt="Photo by Manny Moreno"
                  className="h-full w-full object-cover object-center"
                  height={550}
                  priority="eager"
                  src="https://images.unsplash.com/photo-1586295166487-b265f7e83a7f?auto=format&q=75&fit=crop&w=550&h=550"
                  width={550}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex h-12 w-full max-w-sm divide-x overflow-hidden rounded-lg border">
              <a
                className="flex w-1/3 items-center justify-center bg-muted/25 text-gray-500 transition duration-100 hover:bg-accent hover:text-accent-foreground active:bg-primary active:text-primary-foreground"
                href="#"
              >
                Men
              </a>
              <a
                className="flex w-1/3 items-center justify-center bg-muted/25 text-gray-500 transition duration-100 hover:bg-accent hover:text-accent-foreground active:bg-primary active:text-primary-foreground"
                href="#"
              >
                Women
              </a>
              <a
                className="flex w-1/3 items-center justify-center bg-muted/25 text-gray-500 transition duration-100 hover:bg-accent hover:text-accent-foreground active:bg-primary active:text-primary-foreground"
                href="#"
              >
                Teens
              </a>
            </div>

            <div className="flex items-center justify-center gap-4 lg:justify-start">
              <span className="font-semibold text-muted-foreground text-sm uppercase tracking-widest sm:text-base">
                Social
              </span>
              <span className="h-px w-12 bg-muted-foreground" />

              <div className="flex gap-4">
                <a
                  className="text-gray-400 transition duration-100 hover:text-gray-500 active:text-gray-600"
                  href="#"
                  rel="noopener"
                  target="_blank"
                >
                  <Icon className="size-5" icon="simple-icons:instagram" />
                </a>

                <a
                  className="text-gray-400 transition duration-100 hover:text-gray-500 active:text-gray-600"
                  href="#"
                  rel="noopener"
                  target="_blank"
                >
                  <Icon className="size-5" icon="simple-icons:twitter" />
                </a>

                <a
                  className="text-gray-400 transition duration-100 hover:text-gray-500 active:text-gray-600"
                  href="#"
                  rel="noopener"
                  target="_blank"
                >
                  <Icon className="size-5" icon="simple-icons:pinterest" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="py-6 sm:py-8 lg:py-12">
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="mb-10 md:mb-16">
            <h3 className="mb-4 text-center font-bold md:mb-6">Selected</h3>

            <p className="mx-auto max-w-screen-md text-center text-gray-500 md:text-md">
              This is a section of some simple filler text, also known as
              placeholder text. It shares some characteristics of a real written
              text but is random or otherwise generated.
            </p>
          </div>

          <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
            <div>
              <a
                className="group relative mb-2 block h-96 overflow-hidden rounded-lg bg-gray-100 shadow-lg lg:mb-3"
                href="#"
              >
                <Image
                  alt="Photo by Austin Wade"
                  className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&q=75&fit=crop&crop=top&w=600&h=700"
                  width={600}
                />

                <div className="absolute bottom-2 left-0 flex gap-2">
                  <span className="rounded-r-lg bg-red-500 px-3 py-1.5 font-semibold text-sm text-white uppercase tracking-wider">
                    -50%
                  </span>
                  <span className="rounded-lg bg-white px-3 py-1.5 font-bold text-gray-800 text-sm uppercase tracking-wider">
                    New
                  </span>
                </div>
              </a>

              <div className="flex items-center justify-between gap-2 px-2">
                <div className="flex flex-col">
                  <a
                    className="font-semibold text-gray-800 text-lg transition duration-100 hover:text-gray-400 lg:text-xl"
                    href="#"
                  >
                    Fancy Outfit
                  </a>
                  <span className="text-gray-500">by Fancy Brand</span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-bold text-gray-600 lg:text-lg">
                    $19.99
                  </span>
                  <span className="text-red-500 text-sm line-through">
                    $39.99
                  </span>
                </div>
              </div>
            </div>

            <div>
              <a
                className="group relative mb-2 block h-96 overflow-hidden rounded-lg bg-gray-100 shadow-lg lg:mb-3"
                href="#"
              >
                <Image
                  alt="Photo by Nick Karvounis"
                  className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1523359346063-d879354c0ea5?auto=format&q=75&fit=crop&crop=top&w=600&h=700"
                  width={600}
                />
              </a>

              <div className="flex items-start justify-between gap-2 px-2">
                <div className="flex flex-col">
                  <a
                    className="font-bold text-gray-800 text-lg transition duration-100 hover:text-gray-500 lg:text-xl"
                    href="#"
                  >
                    Cool Outfit
                  </a>
                  <span className="text-gray-500">by Cool Brand</span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-bold text-gray-600 lg:text-lg">
                    $29.99
                  </span>
                </div>
              </div>
            </div>

            <div>
              <a
                className="group relative mb-2 block h-96 overflow-hidden rounded-lg bg-gray-100 shadow-lg lg:mb-3"
                href="#"
              >
                <Image
                  alt="Photo by Austin Wade"
                  className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1548286978-f218023f8d18?auto=format&q=75&fit=crop&crop=top&w=600&h=700"
                  width={600}
                />
              </a>

              <div className="flex items-start justify-between gap-2 px-2">
                <div className="flex flex-col">
                  <a
                    className="font-bold text-gray-800 text-lg transition duration-100 hover:text-gray-500 lg:text-xl"
                    href="#"
                  >
                    Nice Outfit
                  </a>
                  <span className="text-gray-500">by Nice Brand</span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-bold text-gray-600 lg:text-lg">
                    $35.00
                  </span>
                </div>
              </div>
            </div>

            <div>
              <a
                className="group relative mb-2 block h-96 overflow-hidden rounded-lg bg-gray-100 shadow-lg lg:mb-3"
                href="#"
              >
                <Image
                  alt="Photo by Vladimir Fedotov"
                  className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1566207274740-0f8cf6b7d5a5?auto=format&q=75&fit=crop&crop=top&w=600&h=700"
                  width={600}
                />
              </a>

              <div className="flex items-start justify-between gap-2 px-2">
                <div className="flex flex-col">
                  <a
                    className="font-bold text-gray-800 text-lg transition duration-100 hover:text-gray-500 lg:text-xl"
                    href="#"
                  >
                    Lavish Outfit
                  </a>
                  <span className="text-gray-500">by Lavish Brand</span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="font-bold text-gray-600 lg:text-lg">
                    $49.99
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-6 sm:py-8 lg:py-12">
        <PostList />
      </section>

      <div className="py-6 sm:py-8 lg:py-12">
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="flex flex-col overflow-hidden rounded-lg sm:flex-row md:h-96">
            <div className="flex w-full flex-col bg-gray-900/65 p-4 sm:w-1/2 sm:p-8 lg:w-2/5">
              <h4 className="mb-4 font-bold text-white">
                Summer Sale
                <br />
                Up to 70% off.
              </h4>

              <p className="mb-8 max-w-md text-base text-gray-400">
                This is a section of some simple filler text, also known as
                placeholder text. It shares some characteristics of a real
                written text.
              </p>

              <div className="mt-auto">
                <Button className="px-8 text-base" size="lg" variant="default">
                  Save now
                </Button>
              </div>
            </div>

            <div className="order-first h-48 w-full sm:order-none sm:h-auto sm:w-1/2 lg:w-3/5">
              <Image
                alt="Photo by Dom Hill"
                className="h-full w-full object-cover object-center"
                height={500}
                src="https://images.unsplash.com/photo-1505846951821-e25bacf2eccd?auto=format&q=75&fit=crop&crop=top&w=1000&h=500"
                width={1000}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="py-6 sm:py-8 lg:py-12">
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
          <h2 className="mb-8 text-center font-bold text-2xl md:mb-12 lg:text-3xl">
            Collections
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
            <div>
              <a
                className="group relative flex h-96 items-end overflow-hidden rounded-lg bg-gray-100 p-4 shadow-lg"
                href="#"
              >
                <Image
                  alt="Photo by Austin Wade"
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&q=75&fit=crop&crop=top&w=600&h=700"
                  width={600}
                />

                <div className="relative flex w-full flex-col rounded-lg bg-white p-4 text-center">
                  <span className="text-gray-500">Men</span>
                  <span className="font-bold text-gray-800 text-lg lg:text-xl">
                    Business Causual
                  </span>
                </div>
              </a>
            </div>

            <div>
              <a
                className="group relative flex h-96 items-end overflow-hidden rounded-lg bg-gray-100 p-4 shadow-lg"
                href="#"
              >
                <Image
                  alt="Photo by engin akyurt"
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1603344797033-f0f4f587ab60?auto=format&q=75&fit=crop&crop=top&w=600&h=700"
                  width={600}
                />

                <div className="relative flex w-full flex-col rounded-lg bg-white p-4 text-center">
                  <span className="text-gray-500">Women</span>
                  <span className="font-bold text-gray-800 text-lg lg:text-xl">
                    Summer Season
                  </span>
                </div>
              </a>
            </div>

            <div>
              <a
                className="group relative flex h-96 items-end overflow-hidden rounded-lg bg-gray-100 p-4 shadow-lg"
                href="#"
              >
                <Image
                  alt="Photo by Austin Wade"
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1552668693-d0738e00eca8?auto=format&q=75&fit=crop&crop=top&w=600&h=700"
                  width={600}
                />

                <div className="relative flex w-full flex-col rounded-lg bg-white p-4 text-center">
                  <span className="text-gray-500">Men</span>
                  <span className="font-bold text-gray-800 text-lg lg:text-xl">
                    Streetwear
                  </span>
                </div>
              </a>
            </div>

            <div>
              <a
                className="group relative flex h-96 items-end overflow-hidden rounded-lg bg-gray-100 p-4 shadow-lg"
                href="#"
              >
                <Image
                  alt="Photo by Austin Wade"
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-200 group-hover:scale-110"
                  height={700}
                  src="https://images.unsplash.com/photo-1560269999-cef6ebd23ad3?auto=format&q=75&fit=crop&w=600&h=700"
                  width={600}
                />

                <div className="relative flex w-full flex-col rounded-lg bg-white p-4 text-center">
                  <span className="text-gray-500">Women</span>
                  <span className="font-bold text-gray-800 text-lg lg:text-xl">
                    Sale
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 lg:mt-12">
        <div className="bg-muted/50 py-4 lg:py-8">
          <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-center p-4 sm:p-8 lg:flex-row lg:justify-between">
            <div className="mb-4 sm:mb-8 lg:mb-0">
              <h3 className="text-center font-bold text-accent-foreground lg:text-left">
                Get the latest updates
              </h3>
              <p className="text-center text-muted-foreground lg:text-left">
                Sign up for our newsletter
              </p>
            </div>

            <div className="flex flex-col items-center lg:items-end">
              <form className="mb-3 flex w-full gap-0">
                <Input
                  className="rounded-r-none border-r-0 focus-visible:border-input focus-visible:ring-0"
                  placeholder="Email"
                />

                <Button className="rounded-l-none px-8" variant="outline">
                  Send
                </Button>
              </form>

              <p className="text-center text-muted-foreground text-xs lg:text-right">
                By signing up to our newsletter you agree to our{" "}
                <a className="underline transition duration-100" href="#">
                  Term of Service
                </a>{" "}
                and{" "}
                <a className="underline transition duration-100" href="#">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
