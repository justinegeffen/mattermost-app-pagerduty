import { Request, Response } from 'express';
import fetch from 'node-fetch';
import {
    CallResponseHandler,
    newErrorCallResponseWithMessage,
    newFormCallResponse,
    newOKCallResponse,
    newOKCallResponseWithData,
    newOKCallResponseWithMarkdown
} from '../utils/call-responses';
import { AppCallRequest, AppCallResponse } from '../types';
import { hyperlink } from '../utils/markdown';
import config from '../config';
import { Routes, StoreKeys } from '../constant';
import {
    base64Unicode,
    digestVerifier,
    encodeFormData,
    gen128x8bitNonce
} from '../utils/utils';
import { pagerDutyConfigForm, pagerDutyConfigSubmit } from '../forms/configure-admin-account';
import { KVStoreClient, KVStoreOptions, KVStoreProps } from '../clients/kvstore';

export const configureAdminAccountForm: CallResponseHandler = async (req: Request, res: Response) => {
    let callResponse: AppCallResponse;

    try {
        const form = await pagerDutyConfigForm(req.body);
        callResponse = newFormCallResponse(form);
        res.json(callResponse);
    } catch (error: any) {
        callResponse = newErrorCallResponseWithMessage('Unable to open configuration form: ' + error.message);
        res.json(callResponse);
    }
};

export const configureAdminAccountSubmit: CallResponseHandler = async (req: Request, res: Response) => {
    let callResponse: AppCallResponse;

    try {
        await pagerDutyConfigSubmit(req.body);
        callResponse = newOKCallResponseWithMarkdown('Successfully updated PagerDuty configuration');
        res.json(callResponse);
    } catch (error: any) {
        callResponse = newErrorCallResponseWithMessage('Error processing form request: ' + error.message);
        res.json(callResponse);
    }
};

export const connectAccountLoginSubmit: CallResponseHandler = async (req: Request, res: Response) => {
    const call: AppCallRequest = req.body;
    const connectUrl: string = call.context.oauth2.connect_url;

    const callResponse: AppCallResponse = newOKCallResponseWithMarkdown(`Follow this ${hyperlink('link', connectUrl)} to connect Mattermost to your PagerDuty Account.`);
    res.json(callResponse);
};

export const fOauth2Connect: CallResponseHandler = async (req: Request, res: Response) => {
    const call: AppCallRequest = req.body;
    const appPath: string | undefined = call.context.app_path;
    const mattermostUrl: string | undefined = call.context.mattermost_site_url;
    const botAccessToken: string | undefined = call.context.bot_access_token;
    const aouth2CompleteUrl: string = call.context.oauth2.complete_url;
    const state: string | undefined = call.values?.state;

    let callResponse: AppCallResponse;

    const kvOptions: KVStoreOptions = {
        mattermostUrl: <string>mattermostUrl,
        accessToken: <string>botAccessToken
    };
    const kvStoreClient = new KVStoreClient(kvOptions);
    const kvStoreProps: KVStoreProps = await kvStoreClient.kvGet(StoreKeys.config);

    const url: string = `${kvStoreProps.pagerduty_client_url}${Routes.PagerDuty.OAuthAuthorizationPathPrefix}`;
    const redirectUri: string = `https://9cf8-201-160-205-161.ngrok.io/oauth2/complete`;
    const codeVerifier: string = gen128x8bitNonce();
    const challengeBuffer: ArrayBuffer = await digestVerifier('dO4FiQGBDerTrbjsMeqU4RZkqtERqX-lj0iXxVspKZd02SxiFLbFU8TX5JwWlkmbu_HzIxQi163GnR2mxg6G7eAQ77R2WolPOxON1uGHv9pi_gqhVjzklz_bzHkz');
    const challenge = base64Unicode(challengeBuffer);

    const urlWithParams = new URL(url);
    urlWithParams.searchParams.append('client_id', kvStoreProps.pagerduty_client_id);
    urlWithParams.searchParams.append('redirect_uri', redirectUri);
    urlWithParams.searchParams.append('response_type', 'code');
    urlWithParams.searchParams.append('scope', 'read write');
    urlWithParams.searchParams.append('code_challenge', encodeURI(challenge));
    urlWithParams.searchParams.append('code_challenge_method', 'S256');

    const link = urlWithParams.href;

    callResponse = newOKCallResponseWithData(link);
    res.json(callResponse);
}

export const fOauth2Complete: CallResponseHandler = async (req: Request, res: Response) => {
    const call: AppCallRequest = req.body;
    console.log('call', call);
    const queryParams = req.query as { code: string, subdomain: string, session_state: string; };

    let callResponse: AppCallResponse;

    const url: string = `https://dev-ancient-tech.pagerduty.com${Routes.PagerDuty.OAuthTokenPathPrefix}`;
    const redirectUrl: string = `https://9cf8-201-160-205-161.ngrok.io/oauth2/complete`;

    const ouathData: any = {
        grant_type: 'authorization_code',
        client_id: '8858cc37-4a3c-4ae0-a063-f6d4fd9182b4',
        redirect_uri: redirectUrl,
        code: queryParams['code'],
        code_verifier: 'dO4FiQGBDerTrbjsMeqU4RZkqtERqX-lj0iXxVspKZd02SxiFLbFU8TX5JwWlkmbu_HzIxQi163GnR2mxg6G7eAQ77R2WolPOxON1uGHv9pi_gqhVjzklz_bzHkz'
    };
    const data = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: encodeFormData(ouathData)
    }).then((response) => response.json());
    console.log('data', data);

    callResponse = newOKCallResponse();
    res.json(callResponse);
}


