// Composables
import { onAnyEnter, onLoginEnter } from "@/router/navigationGuards";
import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        component: () => import("../views/home/Root.vue"),
        children: [
            {
                path: "",
                name: "home",
                component: () => import("../views/home/Home.vue")
            }
        ]
    },
    {
        path: "/",
        component: () => import("../views/home/Root.vue"),
        children: [
            {
                path: "components",
                name: "components",
                component: () => import("../views/home/Components.vue")
            },
            {
                path: "projects",
                name: "projects",
                component: () => import("../views/home/Projects.vue")
            },
            {
                path: "imss",
                name: "imss",
                component: () => import("../views/home/Imss.vue")
            },
            {
                path: "admin",
                name: "admin",
                component: () => import("../views/RouterOnly.vue"),
                children: [
                    {
                        path: "",
                        name: "admin-permissions",
                        component: () => import("../views/admin/Permissions.vue")
                    },
                    {
                        path: "strategy-instances",
                        name: "admin-strategy-instances",
                        component: () => import("../views/admin/StrategyInstances.vue")
                    },
                    {
                        path: "graphiql",
                        name: "admin-graphiql",
                        component: () => import("../views/admin/GraphiQL.vue")
                    }
                ]
            }
        ]
    },
    {
        path: "/components/:trackable",
        component: () => import("../views/component/Root.vue"),
        children: [
            {
                path: "",
                name: "component",
                component: () => import("../views/component/Home.vue")
            }
        ]
    },
    {
        path: "/components/:trackable",
        component: () => import("../views/component/Root.vue"),
        children: [
            {
                path: "details",
                component: () => import("../views/RouterOnly.vue"),
                children: [
                    {
                        path: "",
                        name: "component-details-general",
                        component: () => import("../views/component/details/General.vue")
                    },
                    {
                        path: "interfaces",
                        name: "component-details-interfaces",
                        component: () => import("../views/component/details/Interfaces.vue")
                    },
                    {
                        path: "labels",
                        name: "component-details-labels",
                        component: () => import("../views/label/Labels.vue")
                    },
                    {
                        path: "permissions",
                        name: "component-details-permissions",
                        component: () => import("../views/component/details/Permissions.vue")
                    },
                    {
                        path: "danger",
                        name: "component-details-danger",
                        component: () => import("../views/component/details/Danger.vue")
                    }
                ]
            },
            {
                path: "versions",
                component: () => import("../views/RouterOnly.vue"),
                children: [
                    {
                        path: "",
                        name: "component-versions",
                        component: () => import("../views/component/version/Versions.vue")
                    },
                    {
                        path: ":version",
                        component: () => import("../views/RouterOnly.vue"),
                        children: [
                            {
                                path: "",
                                name: "component-version-general",
                                component: () => import("../views/component/version/General.vue")
                            },
                            {
                                path: "interfaces",
                                name: "component-version-interfaces",
                                component: () => import("../views/component/version/Interfaces.vue")
                            },
                            {
                                path: "danger",
                                name: "component-version-danger",
                                component: () => import("../views/component/version/Danger.vue")
                            }
                        ]
                    }
                ]
            },
            {
                path: "issues",
                component: () => import("../views/RouterOnly.vue"),
                children: [
                    {
                        path: "",
                        name: "component-issues",
                        component: () => import("../views/issue/Issues.vue")
                    },
                    {
                        path: ":issue",
                        name: "component-issue",
                        component: () => import("../views/issue/Issue.vue")
                    }
                ]
            }
        ]
    },
    {
        path: "/projects/:trackable",
        component: () => import("../views/project/Root.vue"),
        children: [
            {
                path: "",
                name: "project",
                component: () => import("../views/project/Home.vue")
            }
        ]
    },
    {
        path: "/projects/:trackable",
        component: () => import("../views/project/Root.vue"),
        children: [
            {
                path: "details",
                component: () => import("../views/RouterOnly.vue"),
                children: [
                    {
                        path: "",
                        name: "project-details-general",
                        component: () => import("../views/project/details/General.vue")
                    },
                    {
                        path: "labels",
                        name: "project-details-labels",
                        component: () => import("../views/label/Labels.vue")
                    },
                    {
                        path: "permissions",
                        name: "project-details-permissions",
                        component: () => import("../views/project/details/Permissions.vue")
                    },
                    {
                        path: "danger",
                        name: "project-details-danger",
                        component: () => import("../views/project/details/Danger.vue")
                    }
                ]
            },
            {
                path: "issues",
                name: "project-issues",
                component: () => import("../views/issue/Issues.vue")
            },
            {
                path: "issues",
                component: () => import("../views/RouterOnly.vue"),
                children: [
                    {
                        path: "",
                        name: "project-issues",
                        component: () => import("../views/issue/Issues.vue")
                    },
                    {
                        path: ":issue",
                        name: "project-issue",
                        component: () => import("../views/issue/Issue.vue")
                    }
                ]
            }
        ]
    },
    {
        path: "/graphiql",
        component: () => import("../views/graphiql/Root.vue"),
        children: [
            {
                path: "",
                component: () => import("../views/admin/GraphiQL.vue")
            }
        ]
    },
    {
        path: "/login",
        name: "login",
        component: () => import("../views/RouterOnly.vue"),
        beforeEnter: onLoginEnter
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

router.beforeEach(onAnyEnter);

export default router;
