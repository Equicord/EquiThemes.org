import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";

function StatsCard({ title, value, icon: Icon }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

export function StatsSection({ stats }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
                <StatsCard key={stat.title} {...stat} />
            ))}
        </div>
    );
}
