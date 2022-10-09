/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/": {
    get: {
      responses: {
        /** OK */
        200: unknown;
      };
    };
  };
  "/classes": {
    get: {
      parameters: {
        query: {
          id?: parameters["rowFilter.classes.id"];
          name?: parameters["rowFilter.classes.name"];
          teacher_first?: parameters["rowFilter.classes.teacher_first"];
          teacher_last?: parameters["rowFilter.classes.teacher_last"];
          room?: parameters["rowFilter.classes.room"];
          /** Filtering Columns */
          select?: parameters["select"];
          /** Ordering */
          order?: parameters["order"];
          /** Limiting and Pagination */
          offset?: parameters["offset"];
          /** Limiting and Pagination */
          limit?: parameters["limit"];
        };
        header: {
          /** Limiting and Pagination */
          Range?: parameters["range"];
          /** Limiting and Pagination */
          "Range-Unit"?: parameters["rangeUnit"];
          /** Preference */
          Prefer?: parameters["preferCount"];
        };
      };
      responses: {
        /** OK */
        200: {
          schema: definitions["classes"][];
        };
        /** Partial Content */
        206: unknown;
      };
    };
    post: {
      parameters: {
        body: {
          /** classes */
          classes?: definitions["classes"];
        };
        query: {
          /** Filtering Columns */
          select?: parameters["select"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** Created */
        201: unknown;
      };
    };
    delete: {
      parameters: {
        query: {
          id?: parameters["rowFilter.classes.id"];
          name?: parameters["rowFilter.classes.name"];
          teacher_first?: parameters["rowFilter.classes.teacher_first"];
          teacher_last?: parameters["rowFilter.classes.teacher_last"];
          room?: parameters["rowFilter.classes.room"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
    patch: {
      parameters: {
        query: {
          id?: parameters["rowFilter.classes.id"];
          name?: parameters["rowFilter.classes.name"];
          teacher_first?: parameters["rowFilter.classes.teacher_first"];
          teacher_last?: parameters["rowFilter.classes.teacher_last"];
          room?: parameters["rowFilter.classes.room"];
        };
        body: {
          /** classes */
          classes?: definitions["classes"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
  };
  "/rooms": {
    get: {
      parameters: {
        query: {
          /** Room ID */
          id?: parameters["rowFilter.rooms.id"];
          created_at?: parameters["rowFilter.rooms.created_at"];
          /** Filtering Columns */
          select?: parameters["select"];
          /** Ordering */
          order?: parameters["order"];
          /** Limiting and Pagination */
          offset?: parameters["offset"];
          /** Limiting and Pagination */
          limit?: parameters["limit"];
        };
        header: {
          /** Limiting and Pagination */
          Range?: parameters["range"];
          /** Limiting and Pagination */
          "Range-Unit"?: parameters["rangeUnit"];
          /** Preference */
          Prefer?: parameters["preferCount"];
        };
      };
      responses: {
        /** OK */
        200: {
          schema: definitions["rooms"][];
        };
        /** Partial Content */
        206: unknown;
      };
    };
    post: {
      parameters: {
        body: {
          /** rooms */
          rooms?: definitions["rooms"];
        };
        query: {
          /** Filtering Columns */
          select?: parameters["select"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** Created */
        201: unknown;
      };
    };
    delete: {
      parameters: {
        query: {
          /** Room ID */
          id?: parameters["rowFilter.rooms.id"];
          created_at?: parameters["rowFilter.rooms.created_at"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
    patch: {
      parameters: {
        query: {
          /** Room ID */
          id?: parameters["rowFilter.rooms.id"];
          created_at?: parameters["rowFilter.rooms.created_at"];
        };
        body: {
          /** rooms */
          rooms?: definitions["rooms"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
  };
  "/schedules": {
    get: {
      parameters: {
        query: {
          room?: parameters["rowFilter.schedules.room"];
          student?: parameters["rowFilter.schedules.student"];
          "1a"?: parameters["rowFilter.schedules.1a"];
          "2a"?: parameters["rowFilter.schedules.2a"];
          "3a"?: parameters["rowFilter.schedules.3a"];
          "4a"?: parameters["rowFilter.schedules.4a"];
          "1b"?: parameters["rowFilter.schedules.1b"];
          "2b"?: parameters["rowFilter.schedules.2b"];
          "3b"?: parameters["rowFilter.schedules.3b"];
          "4b"?: parameters["rowFilter.schedules.4b"];
          /** Filtering Columns */
          select?: parameters["select"];
          /** Ordering */
          order?: parameters["order"];
          /** Limiting and Pagination */
          offset?: parameters["offset"];
          /** Limiting and Pagination */
          limit?: parameters["limit"];
        };
        header: {
          /** Limiting and Pagination */
          Range?: parameters["range"];
          /** Limiting and Pagination */
          "Range-Unit"?: parameters["rangeUnit"];
          /** Preference */
          Prefer?: parameters["preferCount"];
        };
      };
      responses: {
        /** OK */
        200: {
          schema: definitions["schedules"][];
        };
        /** Partial Content */
        206: unknown;
      };
    };
    post: {
      parameters: {
        body: {
          /** schedules */
          schedules?: definitions["schedules"];
        };
        query: {
          /** Filtering Columns */
          select?: parameters["select"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** Created */
        201: unknown;
      };
    };
    delete: {
      parameters: {
        query: {
          room?: parameters["rowFilter.schedules.room"];
          student?: parameters["rowFilter.schedules.student"];
          "1a"?: parameters["rowFilter.schedules.1a"];
          "2a"?: parameters["rowFilter.schedules.2a"];
          "3a"?: parameters["rowFilter.schedules.3a"];
          "4a"?: parameters["rowFilter.schedules.4a"];
          "1b"?: parameters["rowFilter.schedules.1b"];
          "2b"?: parameters["rowFilter.schedules.2b"];
          "3b"?: parameters["rowFilter.schedules.3b"];
          "4b"?: parameters["rowFilter.schedules.4b"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
    patch: {
      parameters: {
        query: {
          room?: parameters["rowFilter.schedules.room"];
          student?: parameters["rowFilter.schedules.student"];
          "1a"?: parameters["rowFilter.schedules.1a"];
          "2a"?: parameters["rowFilter.schedules.2a"];
          "3a"?: parameters["rowFilter.schedules.3a"];
          "4a"?: parameters["rowFilter.schedules.4a"];
          "1b"?: parameters["rowFilter.schedules.1b"];
          "2b"?: parameters["rowFilter.schedules.2b"];
          "3b"?: parameters["rowFilter.schedules.3b"];
          "4b"?: parameters["rowFilter.schedules.4b"];
        };
        body: {
          /** schedules */
          schedules?: definitions["schedules"];
        };
        header: {
          /** Preference */
          Prefer?: parameters["preferReturn"];
        };
      };
      responses: {
        /** No Content */
        204: never;
      };
    };
  };
}

export interface definitions {
  /** @description The classes teachers teach */
  classes: {
    /**
     * Format: uuid
     * @description Note:
     * This is a Primary Key.<pk/>
     * @default extensions.uuid_generate_v4()
     */
    id: string;
    /** Format: text */
    name: string;
    /** Format: text */
    teacher_first: string;
    /** Format: text */
    teacher_last: string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `rooms.id`.<fk table='rooms' column='id'/>
     */
    room: string;
  };
  /** @description The main table to add rooms */
  rooms: {
    /**
     * Format: uuid
     * @description Room ID
     *
     * Note:
     * This is a Primary Key.<pk/>
     * @default extensions.uuid_generate_v4()
     */
    id: string;
    /**
     * Format: timestamp with time zone
     * @default now()
     */
    created_at?: string;
  };
  /** @description The actual schedules */
  schedules: {
    /**
     * Format: uuid
     * @description Note:
     * This is a Primary Key.<pk/>
     * This is a Foreign Key to `rooms.id`.<fk table='rooms' column='id'/>
     */
    room: string;
    /** Format: text */
    student: string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "1a": string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "2a": string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "3a": string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "4a": string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "1b": string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "2b": string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "3b": string;
    /**
     * Format: uuid
     * @description Note:
     * This is a Foreign Key to `classes.id`.<fk table='classes' column='id'/>
     */
    "4b": string;
  };
}

export interface parameters {
  /**
   * @description Preference
   * @enum {string}
   */
  preferParams: "params=single-object";
  /**
   * @description Preference
   * @enum {string}
   */
  preferReturn: "return=representation" | "return=minimal" | "return=none";
  /**
   * @description Preference
   * @enum {string}
   */
  preferCount: "count=none";
  /** @description Filtering Columns */
  select: string;
  /** @description On Conflict */
  on_conflict: string;
  /** @description Ordering */
  order: string;
  /** @description Limiting and Pagination */
  range: string;
  /**
   * @description Limiting and Pagination
   * @default items
   */
  rangeUnit: string;
  /** @description Limiting and Pagination */
  offset: string;
  /** @description Limiting and Pagination */
  limit: string;
  /** @description classes */
  "body.classes": definitions["classes"];
  /** Format: uuid */
  "rowFilter.classes.id": string;
  /** Format: text */
  "rowFilter.classes.name": string;
  /** Format: text */
  "rowFilter.classes.teacher_first": string;
  /** Format: text */
  "rowFilter.classes.teacher_last": string;
  /** Format: uuid */
  "rowFilter.classes.room": string;
  /** @description rooms */
  "body.rooms": definitions["rooms"];
  /**
   * Format: uuid
   * @description Room ID
   */
  "rowFilter.rooms.id": string;
  /** Format: timestamp with time zone */
  "rowFilter.rooms.created_at": string;
  /** @description schedules */
  "body.schedules": definitions["schedules"];
  /** Format: uuid */
  "rowFilter.schedules.room": string;
  /** Format: text */
  "rowFilter.schedules.student": string;
  /** Format: uuid */
  "rowFilter.schedules.1a": string;
  /** Format: uuid */
  "rowFilter.schedules.2a": string;
  /** Format: uuid */
  "rowFilter.schedules.3a": string;
  /** Format: uuid */
  "rowFilter.schedules.4a": string;
  /** Format: uuid */
  "rowFilter.schedules.1b": string;
  /** Format: uuid */
  "rowFilter.schedules.2b": string;
  /** Format: uuid */
  "rowFilter.schedules.3b": string;
  /** Format: uuid */
  "rowFilter.schedules.4b": string;
}

export interface operations {}

export interface external {}