import ThemeList from '@components/theme-list';
import clientPromise from '@utils/db';
import { ObjectId } from 'mongodb';

export async function getServerSideProps({ params }) {
    if (!params?.id) return { notFound: true };
    const client = await clientPromise;
    const db = client.db("submittedThemesDatabase");

    let doc = null;
    try {
        doc = await db.collection("pending").findOne(
            { _id: new ObjectId(params.id), state: "rejected" },
            { projection: { reason: 1, _id: 0 } }
        );
    } catch {
        return { notFound: true };
    }

    return {
        props: {
            id: params.id,
            rejectReason: doc?.reason || null
        },
    };
}

export default function Page({ id, rejectReason }) {
    return <ThemeList id={id} rejectReason={rejectReason} />;
}