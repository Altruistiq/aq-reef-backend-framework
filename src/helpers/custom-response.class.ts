export class CustomResponse {
    private statusCode: number;
    private responseHeaders: [string, string][] = [];
    private responsePayload: unknown;
    public status(statusCode: number) {
        this.statusCode = statusCode;
        return this;
    }

    public header(headerName: string, headerValue: string): CustomResponse {
        this.responseHeaders.push([headerName, headerValue]);
        return this;
    }

    public headers(headers: { [key: string]: string }): CustomResponse {
        Object.entries(headers).forEach(([headerName, headerValue]) => {
            this.header(headerName, headerValue);
        });
        return this;
    }

    public payload(payload: unknown): CustomResponse {
        this.responsePayload = payload
        return this
    }

    public getHeaders(): [string, string][] | undefined {
        return this.responseHeaders
    }

    public getPayload(): unknown | undefined {
        return this.responsePayload
    }

    public getStatusCode(): number | undefined {
        return this.statusCode
    }
}