const config = {
    routes: async () => {
        const items = [
            { data: 'example', id: 1 },
            { data: 'other', id: 2 },
        ];
        // Creates the /items route, and exposes ALL item data
        // Creates the /items/1 and /items/2 routes, and exposes a single item
        return [
            {
                path: '/items',
                data: { items },
                children: items.map((item) => ({
                    path: `/${item.id}`,
                    template: 'src/containers/Item',
                    data: Promise.resolve(item),
                })),
            },
        ];
    },
    plugins: [
        [
            '@react-static/plugin-source-filesystem',
            {
                location: './src/pages',
            },
        ],
        '@react-static/plugin-reach-router',
        '@react-static/plugin-sitemap',
    ],
};
export default config;
