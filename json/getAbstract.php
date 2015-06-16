<?php
/**
 * Created by PhpStorm.
 * User: nextlevelshit
 * Date: 14.06.15
 * Time: 03:50
 */

error_reporting(0);

$page = str_replace(" ", "%20", $_GET['page']);

$lang = ($_GET['lang']) ? $_GET['lang'] : substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);

if (isset($page)) {

    $url = "https://$lang.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=$page";

    $f = fopen($url, 'r');
    $html = '';

    while (!feof($f)) {
        $html .= fread($f, 240000);
    }

    // Decode to Wikipedia output to readable array
    $json = json_decode($html, true);

    // Grep the necessary part of the wikipedia input
    $abstractWiki = array_values($json['query']['pages'])[0];
    $abstractOutput['abstract'] = $abstractWiki['extract'];

    // Close file reading
    fclose($f);

    // Output as readable json
    echo(json_encode($abstractOutput));
}