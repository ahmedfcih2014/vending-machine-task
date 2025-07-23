export type paginateResponseType = {
  data: any[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
};

export type loginType = {
  access_token: string;
};

export type responseType = {
  success: boolean;
  statusCode: number;
  data: string | object | paginateResponseType;
};
