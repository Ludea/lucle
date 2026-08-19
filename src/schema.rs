// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::sql_types::SqlType)]
    #[diesel(
        mysql_type(name = "Enum"),
        sqlite_type(name = "Text"),
        postgres_type(name = "Text")
    )]
    pub struct UsersRepositoriesPermissionEnum;
}

diesel::table! {
    use diesel::sql_types::*;
    repositories (id) {
        id -> Integer,
        #[max_length = 255]
        name -> Varchar,
        created_at -> Timestamp,
        platforms -> Text,
        plugins -> Text,
    }
}

diesel::table! {
    users (id) {
        id -> Integer,
        username -> Text,
        password -> Text,
        email -> Text,
        created_at -> Timestamp,
        modified_at -> Timestamp,
        reset_token -> Nullable<Text>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::UsersRepositoriesPermissionEnum;

    users_repositories (user_id, repository_name) {
        user_id -> Integer,
        #[max_length = 255]
        repository_name -> Varchar,
        #[max_length = 5]
        permission -> UsersRepositoriesPermissionEnum,
    }
}

diesel::table! {
    plugins (id) {
        id           -> Varchar,
        name         -> Varchar,
        icon         -> Varchar,
        author       -> Varchar,
        version      -> Varchar,
        category     -> Varchar,
        price_type   -> Varchar,
        description  -> Text,
        tags         -> Text,
        downloads    -> Integer,
        stars        -> Integer,
        featured     -> Bool,
        enabled      -> Bool,
        installed_at -> Timestamp,
    }
}

diesel::allow_tables_to_appear_in_same_query!(repositories, users, users_repositories,);
