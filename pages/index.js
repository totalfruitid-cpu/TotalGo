export default function Home() {
  return null
}

export async function getServerSideProps(context) {
  const { req } = context
  const token = req.cookies?.session

  // kalau belum login → ke login
  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    }
  }

  // kalau sudah login → arahkan ke dashboard (default role-based nanti di login flow)
  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  }
}