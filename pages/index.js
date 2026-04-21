export default function Home() {
  return null
}

export async function getServerSideProps(context) {
  const { req } = context
  const token = req.cookies?.session

  // ❌ belum login → masuk STORE (bukan login)
  if (!token) {
    return {
      redirect: {
        destination: "/store",
        permanent: false,
      },
    }
  }

  // ✔ sudah login → tetap cek role via login flow (biarkan login yang handle routing)
  return {
    redirect: {
      destination: "/store",
      permanent: false,
    },
  }
}