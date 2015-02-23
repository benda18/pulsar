package controllers;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.conveyal.gtfs.model.Route;
import com.conveyal.gtfs.model.Stop;
import com.conveyal.pulsar.TransferExtractor;
import com.conveyal.pulsar.TransferExtractor.Direction;
import com.conveyal.pulsar.TransferExtractor.RouteDirection;
import com.conveyal.pulsar.TransferExtractor.Transfer2;		//$tim&& should be .Transfer
import com.conveyal.pulsar.TransferExtractor.TransferTime;

import com.conveyal.pulsar.TransferExtractor3;					//$tim33
import com.conveyal.pulsar.TransferExtractor3.Direction3;		//$tim33
import com.conveyal.pulsar.TransferExtractor3.RouteDirection3;	//$tim33
import com.conveyal.pulsar.TransferExtractor3.Transfer3;		//$tim33
import com.conveyal.pulsar.TransferExtractor3.TransferTime3;	//$tim33

import play.*;
import play.libs.Json;
import play.mvc.*;
import views.html.*;

public class Application extends Controller {
    private static Map<String, TransferExtractor> transferExtractorPool = new HashMap<String, TransferExtractor>();
    private static Map<String, TransferExtractor3> transferExtractorPool3 = new HashMap<String, TransferExtractor3>();	//$tim33
	
    // initialize the extractor pool
    static {
        for (File file : new File(Play.application().configuration().getString("gtfs-directory")).listFiles()) {
            if (!file.isDirectory() && file.getName().endsWith(".zip")) {
                String name = file.getName().replace(".zip", "");
                transferExtractorPool.put(name, new TransferExtractor(file));
            }
        }
    }

    // initialize the extractor pool																				//$tim33
    static {																										//$tim33
        for (File file : new File(Play.application().configuration().getString("gtfs-directory")).listFiles()) {	//$tim33
            if (!file.isDirectory() && file.getName().endsWith(".zip")) {											//$tim33
                String name3 = file.getName().replace(".zip", "");													//$tim33
                transferExtractorPool3.put(name3, new TransferExtractor3(file));										//$tim33
            }																										//$tim33
        }																											//$tim33
    }																												//$tim33
    
    public static Result index() {
        return ok(index.render("Your new application is ready."));
    }
    
    /** get all possible transfers for a given direction */
    public static Result transfers (String file, String route, int direction) {
        if (!transferExtractorPool.containsKey(file))
            return notFound("No such GTFS feed");
        
        TransferExtractor t = transferExtractorPool.get(file);
        
        Route r = t.feed.routes.get(route);
        
        if (r == null)
            return notFound("no such route");
        
        if (direction != 0 && direction != 1)
            return badRequest("direction must be 0 or 1");
       
        RouteDirection rd = new RouteDirection(r, Direction.fromGtfs(direction));

        // 100 meter threshold for transfers
        Transfer2[] xfers = t.getTransfers(rd, 400);  	//$tim$$ should be Transfer[ - this is the line where you can change the threshold distance for transfers (in meters)
														//400 meters (default) = 1,312 feet = 0.25 miles
        
        List<Transfer2> ret = new ArrayList<Transfer2>();  //$tim$$ should be <Transfer> <Transfer>
        
        Stop[] fromStops = t.stopsForRouteDirection(rd);
        String destName = fromStops[fromStops.length - 1].stop_name;
        
        for (Transfer2 xfer : xfers) {  //$tim$$ should be (Transfer
            xfer.transferTimes = t.transferTimes(xfer);
            if (xfer.transferTimes.length > 0)
                ret.add(xfer);
            
            Stop[] stops = t.stopsForRouteDirection(xfer.toRouteDirection);
            xfer.toRouteDirection.destination = stops[stops.length - 1].stop_name;
            xfer.fromRouteDirection.destination = destName;
        }
        
        return ok(Json.toJson(ret));
    }

    /** get all possible transfers for a given direction */							//$tim33
    public static Result transfers3 (String file, String route, int direction3) {		//$tim33
        if (!transferExtractorPool3.containsKey(file))								//$tim33
            return notFound("No such GTFS feed");									//$tim33
																					//$tim33
        TransferExtractor3 t3 = transferExtractorPool3.get(file);						//$tim33
																					//$tim33
        Route r3 = t3.feed.routes.get(route);											//$tim33
																					//$tim33
        if (r3 == null)																//$tim33
            return notFound("no such route");										//$tim33
																					//$tim33
        if (direction3 != 0 && direction3 != 1)										//$tim33
            return badRequest("direction must be 0 or 1");							//$tim33
																					//$tim33
        RouteDirection3 rd3 = new RouteDirection3(r3, Direction3.fromGtfs(direction3));	//$tim33
																					//$tim33
        // 100 meter threshold for transfers										//$tim33
        Transfer3[] xfers = t3.getTransfers(rd3, 400);  								//$tim33
											//400 meters (default) = 1,312 feet		//$tim33
																					//$tim33
        List<Transfer3> ret3 = new ArrayList<Transfer3>();  							//$tim33
																					//$tim33
        Stop[] fromStops = t3.stopsForRouteDirection(rd3);							//$tim33
        String destName = fromStops[fromStops.length - 1].stop_name;				//$tim33
																					//$tim33
        for (Transfer3 xfer : xfers) {  //$tim$$ should be (Transfer				//$tim33
            xfer.transferTimes3 = t3.transferTimes3(xfer);								//$tim33
            if (xfer.transferTimes3.length > 0)										//$tim33
                ret3.add(xfer);														//$tim33
																					//$tim33
            Stop[] stops = t3.stopsForRouteDirection(xfer.toRouteDirection3);			//$tim33
            xfer.toRouteDirection3.destination = stops[stops.length - 1].stop_name;	//$tim33
            xfer.fromRouteDirection3.destination = destName;							//$tim33
        }																			//$tim33
																					//$tim33
        return ok(Json.toJson(ret3));												//$tim33
    }																				//$tim33
    
    /** get all the routes for a given file */
    public static Result routes (String file) {
        if (!transferExtractorPool.containsKey(file))
            return notFound("No such GTFS feed");
        
        TransferExtractor t = transferExtractorPool.get(file);
        
        return ok(Json.toJson(t.feed.routes.values()));
    }


    public static Result routes3 (String file) {					//$tim33
        if (!transferExtractorPool3.containsKey(file))				//$tim33
            return notFound("No such GTFS feed");					//$tim33
																	//$tim33
        TransferExtractor3 t3 = transferExtractorPool3.get(file);	//$tim33
																	//$tim33
        return ok(Json.toJson(t3.feed.routes.values()));			//$tim33
    }																//$tim33
}																//$tim33
