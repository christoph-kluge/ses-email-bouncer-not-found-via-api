# ses-email-bouncer-not-found-via-api

An SES email bouncer which uses an api to check if mail exists (AWS Simple Email Service)

## Install

1. Create an api where you can GET/HEAD the recipient and return a 2xx or any custom code
2. Setup the lambda with index.js
3. Add an Inline-Policy to your AWS Lambda and allow the lambda to send SES bounces 

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowSesBounce",
            "Effect": "Allow",
            "Action": "ses:SendBounce",
            "Resource": "*"
        }
    ]
}
```

4. Setup new Ses-Rule - Action: Lambda, Invocation-Type: RequestResponse 
