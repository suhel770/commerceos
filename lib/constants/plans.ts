export interface PlanLimits {

  products:number;

  images:number;

  videos:number;

  storageGB:number;

  aiCredits:number;

  users:number;

}

export const PLANS={

    Starter:{

        products:500,

        images:5000,

        videos:50,

        storageGB:25,

        aiCredits:500,

        users:2,

    },

    Growth:{

        products:5000,

        images:50000,

        videos:500,

        storageGB:250,

        aiCredits:5000,

        users:10,

    },

    Enterprise:{

        products:Number.MAX_SAFE_INTEGER,

        images:Number.MAX_SAFE_INTEGER,

        videos:Number.MAX_SAFE_INTEGER,

        storageGB:Number.MAX_SAFE_INTEGER,

        aiCredits:Number.MAX_SAFE_INTEGER,

        users:Number.MAX_SAFE_INTEGER,

    },

} satisfies Record<string,PlanLimits>;