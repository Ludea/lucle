FROM alpine:3.21
WORKDIR /opt/lucle
ARG TARGETARCH

COPY lucle-$TARGETARCH/lucle .
RUN chmod +x lucle

COPY web/dist ./web/dist
COPY pkey .

EXPOSE 3000
EXPOSE 8080

CMD ["./lucle"] 
