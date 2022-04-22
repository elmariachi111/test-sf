import { Button, Container, Flex, FormControl, FormLabel, Heading, Input, Text } from "@chakra-ui/react";
import { Contract, ethers } from "ethers";
import type { NextPage } from "next";
import Head from "next/head";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Account } from "../components/Account";
import { useWeb3 } from "../components/Web3Context";
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";

const Home: NextPage = () => {
  const [sf, setFramework] = useState<Framework>();
  const [daiXContract, setDaiXContract] = useState<SuperToken>();
  const [daiXBalance, setDaiXBalance] = useState<string>();

  const { provider, signer, account,chainId } = useWeb3();

  useEffect(() => {
    if (!provider || !chainId) return;

    (async () => {
      const _sf = await Framework.create({
        chainId,
        provider,
      });
      const _daiXContract = await _sf.loadSuperToken("fDAIx");
      setDaiXContract(_daiXContract);
      setFramework(_sf);
    })();
  }, [provider, chainId]);
  
  useEffect(() => {
    if (!daiXContract || !provider || !account) return;
    (async () => {
      
      const _bal = await daiXContract.balanceOf({
        account,
        providerOrSigner: provider
      });
      setDaiXBalance(_bal);
    })();
  }, [daiXContract, provider, account])

  useEffect(() => {
    if (!sf || !account) return;
    (async() => {
      const _streams = await sf.query.listStreams({sender: account });
      console.log("STREAMS", _streams.data);
    })();
  }, [sf, account]);

  const createStream = useCallback(async (from: string, to: string) => {
    if (!sf || !signer || !daiXContract) return;
    const flowRate = ethers.utils.parseUnits("0.0005").toString();
    console.log(flowRate);
    
    console.log(await signer.getAddress(),  flowRate);
    const createFlowOperation = sf.cfaV1.createFlow({
      flowRate, //DAI wei / s
      receiver: to,
      superToken: daiXContract.address
      // userData?: string
    });

    const result = await createFlowOperation.exec(signer);
    console.log(result);
  }, [sf, signer, daiXContract]);

  const onSubmit = (e: any) => {
    e.preventDefault();
    if (!account) throw "not possible";

    const data = new FormData(e.target);
    const values = Object.fromEntries(data.entries());
    console.log({...values, from: account} );
    createStream(account, values["to"] as string)
    return false;
  } 
  // acc2 0x0dbc08Db1e5E8B17234852fb76e2fB8043B24589
  
  return (
    <Container maxW="container.xl" p="2" h="100vh" as={Flex} direction="column">
      <Head>
        <title>superfluid tokens</title>
      </Head>
      <Flex justify="space-between" align="center" my={12}>
        <Heading>tokens</Heading>
        <Account />
      </Flex>

      <Flex my={12} gridGap={5}>
        <Text>DAIx Balance</Text>
        <Text>{daiXBalance}</Text>
      </Flex>

      <form onSubmit={onSubmit}>
        <Flex direction="column">
          <Text>From: {account}</Text>
        <Flex direction="row">
          <FormControl >
            <Input name="to" type="text" placeholder="recipient"></Input>
            
          </FormControl>
          <Button type="submit">start stream</Button>
        </Flex>
        </Flex>
      </form>
    </Container>
  );
};

export default Home;
